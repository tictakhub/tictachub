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
  | { t: "bye" }
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

/**
 * STUN servers help two browsers find each other. For players behind strict
 * mobile-carrier / corporate NATs you'd also add a TURN relay here, e.g.
 * { urls: "turn:YOUR_HOST:3478", username: "...", credential: "..." }
 */
const PEER_CONFIG = {
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      { urls: "stun:stun.cloudflare.com:3478" },
    ],
  },
};

/** errors that only mean "lost the signalling server for a moment" */
const TRANSIENT = new Set(["network", "server-error", "socket-error", "socket-closed", "disconnected"]);

/** how long a guest keeps knocking before giving up (host may be switching apps to send the link) */
const JOIN_PATIENCE_MS = 120_000; // 2 minutes

export function useOnlineSession() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [code, setCode] = useState("");
  const [myName, setMyName] = useState("");
  const [names, setNames] = useState<OnlineNames | null>(null);
  const [myMark, setMyMark] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameState>(initialState);
  /** host only: is the room currently registered with the signalling server? */
  const [signalOk, setSignalOk] = useState(false);
  /** "left" = opponent clicked Leave; "dropped" = network/browser closed */
  const [disconnectReason, setDisconnectReason] = useState<"left" | "dropped" | null>(null);

  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
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

  /* Phones suspend background tabs (e.g. while you paste the invite link into
     WhatsApp) which drops the room from the signalling server. Reconnect the
     moment the page is back, and keep nudging while it's visible. */
  useEffect(() => {
    const wake = () => {
      const p = peerRef.current;
      if (p && !p.destroyed && p.disconnected) {
        try {
          p.reconnect();
        } catch {
          /* noop */
        }
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") wake();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", wake);
    window.addEventListener("online", wake);
    window.addEventListener("pageshow", wake);
    const iv = setInterval(wake, 4000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", wake);
      window.removeEventListener("online", wake);
      window.removeEventListener("pageshow", wake);
      clearInterval(iv);
    };
  }, []);

  const leave = useCallback(() => {
    // Send a clean farewell so the opponent knows it was intentional, not a drop
    const c = connRef.current;
    if (c?.open) {
      try { c.send({ t: "bye" } satisfies NetMessage); } catch { /* ignore */ }
    }
    teardown();
    setStatus("idle");
    setCode("");
    setNames(null);
    setMyMark(null);
    setError(null);
    setSignalOk(false);
    setDisconnectReason(null);
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

      setSignalOk(false);
      let opened = false;
      const peer = new Peer(ROOM_PREFIX + c.toLowerCase(), PEER_CONFIG);
      peerRef.current = peer;

      const scheduleReconnect = (ms = 1500) => {
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(() => {
          reconnectRef.current = null;
          if (peerRef.current !== peer || peer.destroyed) return;
          if (!peer.disconnected) return; // already fine

          // peer.reconnect() is unreliable in PeerJS — destroy & recreate with the same room ID
          try { peer.destroy(); } catch { /* noop */ }

          const freshPeer = new Peer(ROOM_PREFIX + c.toLowerCase(), PEER_CONFIG);
          peerRef.current = freshPeer;

          freshPeer.on("open", () => {
            if (peerRef.current !== freshPeer) return;
            setSignalOk(true);
          });
          freshPeer.on("disconnected", () => {
            if (peerRef.current !== freshPeer) return;
            setSignalOk(false);
            scheduleReconnect(2000);
          });
          freshPeer.on("error", (err) => {
            if (peerRef.current !== freshPeer) return;
            const t = (err as { type?: string }).type ?? "";
            if (TRANSIENT.has(t) || t === "unavailable-id") {
              setSignalOk(false);
              scheduleReconnect(3000);
            }
          });
          freshPeer.on("connection", peer.listeners("connection")[0] as never);
        }, ms);
      };

      peer.on("open", () => {
        if (peerRef.current !== peer) return;
        opened = true;
        setSignalOk(true);
      });

      /* lost the signalling server — the room would vanish for newcomers, so get it back */
      peer.on("disconnected", () => {
        if (peerRef.current !== peer) return;
        setSignalOk(false);
        scheduleReconnect();
      });

      peer.on("error", (err) => {
        if (peerRef.current !== peer) return;
        const type = (err as { type?: string }).type ?? "";
        if (type === "unavailable-id") {
          if (opened) {
            // our own old registration hasn't expired yet — keep the SAME code, retry shortly
            setSignalOk(false);
            scheduleReconnect(2500);
          } else {
            // extremely unlikely collision — try a fresh code
            host(name, target, lang);
          }
          return;
        }
        if (TRANSIENT.has(type)) {
          setSignalOk(false);
          scheduleReconnect(2000);
          return;
        }
        setError("network hiccup — please try again");
        setStatus("error");
      });

      peer.on("connection", (conn) => {
        // the room holds exactly two players — turn away anyone else
        const current = connRef.current;
        if (current?.open) {
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
        // a half-open / dead earlier attempt must not lock the room forever
        if (current) {
          try {
            current.close();
          } catch {
            /* noop */
          }
        }

        connRef.current = conn;
        conn.on("open", () => {
          conn.send({ t: "hello", name } satisfies NetMessage);
          broadcast();
        });
        conn.on("data", (raw) => {
          if (connRef.current !== conn) return;
          const msg = raw as NetMessage;
          if (!msg || typeof msg !== "object") return;

          if (msg.t === "hello") {
            const n: OnlineNames = { X: myNameRef.current, O: cleanName(msg.name) };
            setNames(n);
            setStatus("connected");
            broadcast(undefined, n);
          } else if (msg.t === "bye") {
            // guest intentionally left — record reason before the close fires
            setDisconnectReason("left");
          } else if (msg.t === "move") {
            // only accept the guest's move, only on the guest's turn
            if (isIndex(msg.index) && gameRef.current.turn === "O") {
              hostApply({ type: "move", index: msg.index });
            }
          } else if (msg.t === "cmd") {
            if (msg.cmd === "newRound" || msg.cmd === "reset") hostApply({ type: msg.cmd });
          }
        });
        conn.on("close", () => {
          if (connRef.current !== conn) return; // an older, replaced connection
          connRef.current = null;
          // If we got a "bye" from the guest, reason is already "left"; else "dropped"
          setDisconnectReason((r) => r ?? "dropped");
          // never got to play → go back to waiting so the link keeps working
          setStatus((prev) => (prev === "connected" ? "closed" : "hosting"));
        });
        conn.on("error", () => {
          if (connRef.current !== conn) return;
          connRef.current = null;
          setStatus((prev) => (prev === "connected" ? "closed" : "hosting"));
        });
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

      const peer = new Peer(PEER_CONFIG);
      peerRef.current = peer;
      const deadline = Date.now() + JOIN_PATIENCE_MS;
      let gotState = false;

      const fail = (msg: string) => {
        clearTimer();
        setError(msg);
        setStatus("error");
        teardown();
      };

      timeoutRef.current = setTimeout(() => {
        if (gotState) return;
        fail("couldn't reach the room — ask your friend to keep the game open, then try again");
      }, JOIN_PATIENCE_MS);

      const attempt = () => {
        if (peerRef.current !== peer || peer.destroyed || gotState) return;
        try {
          connRef.current?.close();
        } catch {
          /* noop */
        }
        const conn = peer.connect(ROOM_PREFIX + c.toLowerCase(), { reliable: true });
        connRef.current = conn;
        conn.on("open", () => {
          conn.send({ t: "hello", name } satisfies NetMessage);
        });
        conn.on("data", (raw) => {
          const msg = raw as NetMessage;
          if (!msg || typeof msg !== "object") return;

          if (msg.t === "full") {
            fail("that room is already full");
          } else if (msg.t === "bye") {
            // host intentionally quit — record reason before the close fires
            setDisconnectReason("left");
          } else if (msg.t === "state" && msg.game && msg.names) {
            gotState = true;
            clearTimer();
            setNames({ X: cleanName(msg.names.X), O: cleanName(msg.names.O) });
            gameRef.current = msg.game;
            setGame(msg.game);
            setStatus("connected");
          }
        });
        conn.on("close", () => {
          if (connRef.current === conn && gotState) {
            setDisconnectReason((r) => r ?? "dropped");
            setStatus("closed");
          }
        });
      };

      peer.on("error", (err) => {
        if (peerRef.current !== peer) return;
        const type = (err as { type?: string }).type;
        if (type === "peer-unavailable" && Date.now() < deadline) {
          // host may be mid-reconnect — knock again sooner
          setTimeout(attempt, 1500);
          return;
        }
        fail(type === "peer-unavailable" ? "room not found — check the code" : "network hiccup — try again");
      });

      peer.on("open", attempt);
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

  return { status, code, myName, names, myMark, error, game, signalOk, disconnectReason, host, join, move, cmd, leave };
}
