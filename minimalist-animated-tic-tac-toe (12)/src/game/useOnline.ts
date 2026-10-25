import { useCallback, useEffect, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";
import { initialState, reduce, type GameState, type Scores } from "./engine";
import { getWinInfo, type Player } from "./logic";
import { pickRoast, type Lang } from "./roasts";

export type { GameState, Scores };

export interface OnlineNames {
  X: string;
  O: string;
}

export type SessionStatus = "idle" | "hosting" | "connecting" | "connected" | "error" | "closed";

export type NetMessage =
  | { t: "hello"; name: string }
  | { t: "move"; index: number }
  | { t: "cmd"; cmd: "newRound" | "reset" }
  | { t: "state"; game: GameState; names: OnlineNames }
  | { t: "full" };

/** keep untrusted peer data from breaking the UI */
const MAX_NAME = 12;
const cleanName = (v: unknown): string => {
  if (typeof v !== "string") return "Player";
  const s = v.replace(/[\u0000-\u001F\u007F<>]/g, "").trim().slice(0, MAX_NAME);
  return s.length ? s : "Player";
};
const isIndex = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 8;

const ROOM_PREFIX = "ttt-duel-";
/** unambiguous alphabet — no O/0, I/1, L confusion */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** 8 chars over a 31-char alphabet ≈ 8.5 × 10^11 combos — not brute-forceable */
export const ROOM_CODE_LENGTH = 4;

/** cryptographically secure, unbiased room code */
function makeCode(): string {
  const n = ALPHABET.length;
  // reject values that would bias the modulo
  const limit = 256 - (256 % n);
  const out: string[] = [];
  const buf = new Uint8Array(ROOM_CODE_LENGTH * 2);

  while (out.length < ROOM_CODE_LENGTH) {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(buf);
    } else {
      for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
    }
    for (let i = 0; i < buf.length && out.length < ROOM_CODE_LENGTH; i++) {
      if (buf[i] < limit) out.push(ALPHABET[buf[i] % n]);
    }
  }
  return out.join("");
}

const FALLBACK_NAMES: OnlineNames = { X: "Player X", O: "Player O" };

export function useOnlineSession() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [code, setCode] = useState("");
  const [myName, setMyName] = useState("");
  const [names, setNames] = useState<OnlineNames | null>(null);
  const [myMark, setMyMark] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameState>(initialState);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameRef = useRef(game);
  gameRef.current = game;
  const namesRef = useRef(names);
  namesRef.current = names;
  const myMarkRef = useRef(myMark);
  myMarkRef.current = myMark;
  const myNameRef = useRef(myName);
  myNameRef.current = myName;
  const langRef = useRef<Lang>("en");

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const teardown = useCallback(() => {
    clearTimer();
    try {
      connRef.current?.close();
    } catch {
      /* noop */
    }
    try {
      peerRef.current?.destroy();
    } catch {
      /* noop */
    }
    connRef.current = null;
    peerRef.current = null;
  }, [clearTimer]);

  useEffect(() => teardown, [teardown]);

  const leave = useCallback(() => {
    teardown();
    setStatus("idle");
    setCode("");
    setNames(null);
    setMyMark(null);
    setError(null);
    setGame(initialState());
  }, [teardown]);

  /* host only: push the authoritative snapshot to the guest */
  const broadcast = useCallback((g?: GameState, n?: OnlineNames) => {
    const c = connRef.current;
    if (c?.open) {
      c.send({
        t: "state",
        game: g ?? gameRef.current,
        names: n ?? namesRef.current ?? FALLBACK_NAMES,
      } satisfies NetMessage);
    }
  }, []);

  /* host only: apply an action and broadcast the result */
  const hostApply = useCallback(
    (action: Parameters<typeof reduce>[1]) => {
      const g = gameRef.current;
      const next = reduce(g, action);
      if (next === g) return;

      /* when a round ends the HOST generates the roast so both screens match */
      let final = next;
      if (action.type === "move") {
        const w = getWinInfo(next.board);
        const draw = !w && next.board.every(Boolean);
        if (w || draw) {
          const lang = langRef.current;
          const n = namesRef.current ?? { X: "Player X", O: "Player O" };
          const loser = w ? n[w.winner === "X" ? "O" : "X"] : "";
          const goal = next.target;
          const decided = goal > 0 && (next.scores.X >= goal || next.scores.O >= goal);
          final = {
            ...next,
            roast: pickRoast(loser, draw, lang),
            roastLang: lang,
            champRoast: decided ? pickRoast(loser, draw, lang) : "",
          };
        }
      }

      gameRef.current = final;
      setGame(final);
      broadcast(final);
    },
    [broadcast]
  );

  const host = useCallback(
    (name: string, target = 0, lang: Lang = "en") => {
      teardown();
      setError(null);
      langRef.current = lang;
      setMyName(name);
      myNameRef.current = name;
      setMyMark("X");
      const initial = initialState(target);
      setGame(initial);
      gameRef.current = initial;

      const c = makeCode();
      setCode(c);
      setNames({ X: name, O: "joining…" });
      setStatus("hosting");

      const peer = new Peer(ROOM_PREFIX + c.toLowerCase());
      peerRef.current = peer;

      peer.on("error", (err) => {
        const type = (err as { type?: string }).type;
        if (type === "unavailable-id") {
          // extremely unlikely collision — try a fresh code
          host(name);
          return;
        }
        setError("network hiccup — please try again");
        setStatus("error");
      });

      peer.on("connection", (conn) => {
        // the room holds exactly two players — turn away anyone else
        if (connRef.current) {
          try {
            conn.on("open", () => {
              conn.send({ t: "full" } satisfies NetMessage);
              setTimeout(() => conn.close(), 150);
            });
          } catch {
            /* ignore */
          }
          return;
        }

        connRef.current = conn;
        conn.on("open", () => {
          conn.send({ t: "hello", name } satisfies NetMessage);
          broadcast();
        });
        conn.on("data", (raw) => {
          const msg = raw as NetMessage;
          if (!msg || typeof msg !== "object") return;

          if (msg.t === "hello") {
            const n: OnlineNames = { X: myNameRef.current, O: cleanName(msg.name) };
            setNames(n);
            setStatus("connected");
            broadcast(undefined, n);
          } else if (msg.t === "move") {
            // only accept the guest's move, only on the guest's turn
            if (isIndex(msg.index) && gameRef.current.turn === "O") {
              hostApply({ type: "move", index: msg.index });
            }
          } else if (msg.t === "cmd") {
            if (msg.cmd === "newRound" || msg.cmd === "reset") hostApply({ type: msg.cmd });
          }
        });
        conn.on("close", () => setStatus("closed"));
      });
    },
    [broadcast, hostApply, teardown]
  );

  const join = useCallback(
    (name: string, codeRaw: string) => {
      teardown();
      setError(null);
      setMyName(name);
      myNameRef.current = name;
      setMyMark("O");
      const c = codeRaw.trim().toUpperCase();
      setCode(c);
      setStatus("connecting");

      const peer = new Peer();
      peerRef.current = peer;

      timeoutRef.current = setTimeout(() => {
        setError("couldn't reach the room — check the code");
        setStatus("error");
        teardown();
      }, 10000);

      peer.on("error", (err) => {
        clearTimer();
        const type = (err as { type?: string }).type;
        setError(type === "peer-unavailable" ? "room not found — check the code" : "network hiccup — try again");
        setStatus("error");
      });

      peer.on("open", () => {
        const conn = peer.connect(ROOM_PREFIX + c.toLowerCase(), { reliable: true });
        connRef.current = conn;
        conn.on("open", () => {
          conn.send({ t: "hello", name } satisfies NetMessage);
        });
        conn.on("data", (raw) => {
          const msg = raw as NetMessage;
          if (!msg || typeof msg !== "object") return;

          if (msg.t === "full") {
            clearTimer();
            setError("that room is already full");
            setStatus("error");
            teardown();
          } else if (msg.t === "state" && msg.game && msg.names) {
            clearTimer();
            setNames({ X: cleanName(msg.names.X), O: cleanName(msg.names.O) });
            gameRef.current = msg.game;
            setGame(msg.game);
            setStatus("connected");
          }
        });
        conn.on("close", () => setStatus("closed"));
      });
    },
    [clearTimer, teardown]
  );

  /** place a mark — host applies locally, guest requests it */
  const move = useCallback(
    (index: number) => {
      const g = gameRef.current;
      if (g.turn !== myMarkRef.current) return;
      if (myMarkRef.current === "X") hostApply({ type: "move", index });
      else connRef.current?.send({ t: "move", index } satisfies NetMessage);
    },
    [hostApply]
  );

  /** newRound / reset — either side may request */
  const cmd = useCallback(
    (c: "newRound" | "reset") => {
      if (myMarkRef.current === "X") hostApply({ type: c });
      else connRef.current?.send({ t: "cmd", cmd: c } satisfies NetMessage);
    },
    [hostApply]
  );

  return { status, code, myName, names, myMark, error, game, host, join, move, cmd, leave };
}
