import { useCallback, useEffect, useRef, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  remove,
  onValue,
  onChildAdded,
  off,
} from "firebase/database";
import { initialState, reduce, type GameState, type Scores } from "./engine";
import { getWinInfo, type Player } from "./logic";
import { pickRoast, type Lang } from "./roasts";

export type { GameState, Scores };

export interface OnlineNames {
  X: string;
  O: string;
}

export type SessionStatus =
  | "idle"
  | "hosting"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

export type NetMessage =
  | { t: "hello"; name: string }
  | { t: "move"; index: number }
  | { t: "cmd"; cmd: "newRound" | "reset" }
  | { t: "state"; game: GameState; names: OnlineNames }
  | { t: "bye" }
  | { t: "full" };

// ─── helpers ──────────────────────────────────────────────────────────────────

const MAX_NAME = 12;
const cleanName = (v: unknown): string => {
  if (typeof v !== "string") return "Player";
  const s = v.replace(/[\u0000-\u001F\u007F<>]/g, "").trim().slice(0, MAX_NAME);
  return s.length ? s : "Player";
};
const isIndex = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 8;

const ROOM_PREFIX = "ttt-duel-";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 4;

function makeCode(): string {
  const n = ALPHABET.length;
  const limit = 256 - (256 % n);
  const out: string[] = [];
  const buf = new Uint8Array(ROOM_CODE_LENGTH * 2);
  while (out.length < ROOM_CODE_LENGTH) {
    crypto.getRandomValues(buf);
    for (const b of buf) {
      if (out.length >= ROOM_CODE_LENGTH) break;
      if (b < limit) out.push(ALPHABET[b % n]);
    }
  }
  return out.join("");
}

// ─── Firebase (signalling only — game data goes direct P2P) ──────────────────

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCm_Hjh6G0aYgwNp4AfXMYKfpskZ9P8uLg",
  authDomain: "tictac-703c3.firebaseapp.com",
  databaseURL:
    "https://tictac-703c3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tictac-703c3",
  storageBucket: "tictac-703c3.firebasestorage.app",
  messagingSenderId: "18898993187",
  appId: "1:18898993187:web:0ac2ea98a8365aa12f7196",
};

// Initialise only once (HMR-safe)
const fbApp =
  getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];
const db = getDatabase(fbApp);

// ─── WebRTC config ────────────────────────────────────────────────────────────

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
};

const FALLBACK_NAMES: OnlineNames = { X: "Player X", O: "Player O" };

/** How long a guest waits for the host's room to appear */
const JOIN_PATIENCE_MS = 120_000;

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useOnlineSession() {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [code, setCode] = useState("");
  const [myName, setMyName] = useState("");
  const [names, setNames] = useState<OnlineNames | null>(null);
  const [myMark, setMyMark] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<GameState>(initialState);
  const [disconnectReason, setDisconnectReason] = useState<
    "left" | "dropped" | null
  >(null);

  // signalOk: true while Firebase offer is written and room is live
  const [signalOk, setSignalOk] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const namesRef = useRef(names);
  namesRef.current = names;
  const myMarkRef = useRef(myMark);
  myMarkRef.current = myMark;
  const myNameRef = useRef(myName);
  myNameRef.current = myName;
  const langRef = useRef<Lang>("en");
  const roomCodeRef = useRef("");
  /** accumulated Firebase off-functions */
  const fbUnsub = useRef<Array<() => void>>([]);

  // ── teardown ────────────────────────────────────────────────────────────────

  const teardown = useCallback(() => {
    fbUnsub.current.forEach((fn) => fn());
    fbUnsub.current = [];
    try { dcRef.current?.close(); } catch { /* noop */ }
    try { pcRef.current?.close(); } catch { /* noop */ }
    dcRef.current = null;
    pcRef.current = null;
  }, []);

  useEffect(() => teardown, [teardown]);

  const cleanupRoom = useCallback((c: string) => {
    if (c) remove(ref(db, `rooms/${c}`)).catch(() => {});
  }, []);

  // ── send (data channel) ─────────────────────────────────────────────────────

  const send = useCallback((msg: NetMessage) => {
    const dc = dcRef.current;
    if (dc?.readyState === "open") {
      try { dc.send(JSON.stringify(msg)); } catch { /* noop */ }
    }
  }, []);

  // ── broadcast (host → guest full state) ────────────────────────────────────

  const broadcast = useCallback(
    (g?: GameState, n?: OnlineNames) => {
      send({
        t: "state",
        game: g ?? gameRef.current,
        names: n ?? namesRef.current ?? FALLBACK_NAMES,
      });
    },
    [send]
  );

  // ── hostApply ───────────────────────────────────────────────────────────────

  const hostApply = useCallback(
    (action: Parameters<typeof reduce>[1]) => {
      const g = gameRef.current;
      const next = reduce(g, action);
      if (next === g) return;
      let final = next;
      if (action.type === "move") {
        const w = getWinInfo(next.board);
        const draw = !w && next.board.every(Boolean);
        if (w || draw) {
          const lang = langRef.current;
          const n = namesRef.current ?? FALLBACK_NAMES;
          const loser = w ? n[w.winner === "X" ? "O" : "X"] : "";
          const goal = next.target;
          const decided =
            goal > 0 && (next.scores.X >= goal || next.scores.O >= goal);
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

  // ── leave ───────────────────────────────────────────────────────────────────

  const leave = useCallback(() => {
    const dc = dcRef.current;
    if (dc?.readyState === "open") {
      try { dc.send(JSON.stringify({ t: "bye" } satisfies NetMessage)); } catch { /* noop */ }
    }
    const c = roomCodeRef.current;
    teardown();
    cleanupRoom(c);
    setStatus("idle");
    setCode("");
    setNames(null);
    setMyMark(null);
    setError(null);
    setSignalOk(false);
    setDisconnectReason(null);
    setGame(initialState());
    roomCodeRef.current = "";
  }, [teardown, cleanupRoom]);

  // ── host ────────────────────────────────────────────────────────────────────

  const host = useCallback(
    async (name: string, target = 0, lang: Lang = "en") => {
      teardown();
      setError(null);
      langRef.current = lang;
      setMyName(name);
      myNameRef.current = name;
      setMyMark("X");
      myMarkRef.current = "X";

      const initial = initialState(target);
      setGame(initial);
      gameRef.current = initial;

      const c = makeCode();
      setCode(c);
      roomCodeRef.current = c;
      setNames({ X: name, O: "joining…" });
      setStatus("hosting");
      setSignalOk(false);

      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // Data channel (host creates it)
        const dc = pc.createDataChannel("game", { ordered: true });
        dcRef.current = dc;

        dc.onopen = () => {
          if (dcRef.current !== dc) return;
          send({ t: "hello", name });
          setTimeout(() => broadcast(), 300);
        };

        dc.onmessage = (e) => {
          if (dcRef.current !== dc) return;
          try {
            const msg = JSON.parse(e.data as string) as NetMessage;
            if (!msg || typeof msg !== "object") return;
            if (msg.t === "hello") {
              const n: OnlineNames = {
                X: myNameRef.current,
                O: cleanName(msg.name),
              };
              namesRef.current = n;
              setNames(n);
              setStatus("connected");
              broadcast(undefined, n);
            } else if (msg.t === "bye") {
              setDisconnectReason("left");
            } else if (msg.t === "move") {
              if (isIndex(msg.index) && gameRef.current.turn === "O") {
                hostApply({ type: "move", index: msg.index });
              }
            } else if (msg.t === "cmd") {
              if (msg.cmd === "newRound" || msg.cmd === "reset")
                hostApply({ type: msg.cmd });
            }
          } catch { /* ignore bad frames */ }
        };

        dc.onclose = () => {
          if (dcRef.current !== dc) return;
          dcRef.current = null;
          setDisconnectReason((r) => r ?? "dropped");
          setStatus((prev) => (prev === "connected" ? "closed" : "hosting"));
        };

        dc.onerror = () => {
          if (dcRef.current !== dc) return;
          setDisconnectReason((r) => r ?? "dropped");
          setStatus((prev) => (prev === "connected" ? "closed" : "hosting"));
        };

        // ICE → Firebase
        pc.onicecandidate = (e) => {
          if (e.candidate && pcRef.current === pc) {
            push(
              ref(db, `rooms/${c}/hostCandidates`),
              e.candidate.toJSON()
            ).catch(() => {});
          }
        };

        // Create & publish offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await set(ref(db, `rooms/${c}`), {
          offer: { type: offer.type, sdp: offer.sdp },
          hostName: name,
          createdAt: Date.now(),
        });

        setSignalOk(true);

        // Listen for guest answer
        const answerRef = ref(db, `rooms/${c}/answer`);
        onValue(answerRef, async (snap) => {
          if (!snap.exists() || pcRef.current !== pc) return;
          if (pc.remoteDescription) return; // already have one
          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription(
                snap.val() as RTCSessionDescriptionInit
              )
            );
          } catch { /* noop */ }
        });
        fbUnsub.current.push(() => off(answerRef));

        // Listen for guest ICE candidates
        const gCandRef = ref(db, `rooms/${c}/guestCandidates`);
        onChildAdded(gCandRef, (snap) => {
          if (pcRef.current !== pc) return;
          pc.addIceCandidate(
            new RTCIceCandidate(snap.val() as RTCIceCandidateInit)
          ).catch(() => {});
        });
        fbUnsub.current.push(() => off(gCandRef));
      } catch {
        setError("failed to create room — please try again");
        setStatus("error");
        setSignalOk(false);
      }
    },
    [teardown, send, broadcast, hostApply]
  );

  // ── join ────────────────────────────────────────────────────────────────────

  const join = useCallback(
    async (name: string, codeRaw: string) => {
      teardown();
      setError(null);
      setMyName(name);
      myNameRef.current = name;
      setMyMark("O");
      myMarkRef.current = "O";

      const c = codeRaw.trim().toUpperCase();
      setCode(c);
      roomCodeRef.current = c;
      setStatus("connecting");

      const deadline = Date.now() + JOIN_PATIENCE_MS;
      let timerHandle: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        setError(
          "couldn't reach the room — ask your friend to keep the game open, then try again"
        );
        setStatus("error");
        teardown();
      }, JOIN_PATIENCE_MS);

      const clearTimer = () => {
        if (timerHandle) { clearTimeout(timerHandle); timerHandle = null; }
      };

      try {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;

        // ICE → Firebase
        pc.onicecandidate = (e) => {
          if (e.candidate && pcRef.current === pc) {
            push(
              ref(db, `rooms/${c}/guestCandidates`),
              e.candidate.toJSON()
            ).catch(() => {});
          }
        };

        // Data channel arrives from host
        pc.ondatachannel = (e) => {
          const dc = e.channel;
          dcRef.current = dc;

          dc.onopen = () => {
            clearTimer();
            send({ t: "hello", name });
          };

          dc.onmessage = (ev) => {
            if (dcRef.current !== dc) return;
            try {
              const msg = JSON.parse(ev.data as string) as NetMessage;
              if (!msg || typeof msg !== "object") return;
              if (msg.t === "bye") {
                setDisconnectReason("left");
              } else if (msg.t === "state" && msg.game && msg.names) {
                namesRef.current = {
                  X: cleanName(msg.names.X),
                  O: cleanName(msg.names.O),
                };
                setNames(namesRef.current);
                gameRef.current = msg.game;
                setGame(msg.game);
                setStatus("connected");
              }
            } catch { /* ignore bad frames */ }
          };

          dc.onclose = () => {
            if (dcRef.current !== dc) return;
            dcRef.current = null;
            setDisconnectReason((r) => r ?? "dropped");
            setStatus("closed");
          };

          dc.onerror = () => {
            if (dcRef.current !== dc) return;
            setDisconnectReason((r) => r ?? "dropped");
            setStatus("closed");
          };
        };

        // Poll Firebase for the host's offer
        const tryGetOffer = async (): Promise<void> => {
          if (pcRef.current !== pc) return;
          if (Date.now() > deadline) return;

          const snap = await get(ref(db, `rooms/${c}/offer`));

          if (!snap.exists()) {
            // Room not ready yet — wait 1.5s and retry
            await new Promise((r) => setTimeout(r, 1500));
            return tryGetOffer();
          }

          try {
            const offer = snap.val() as RTCSessionDescriptionInit;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Publish answer to Firebase
            await set(ref(db, `rooms/${c}/answer`), {
              type: answer.type,
              sdp: answer.sdp,
            });

            // Listen for host ICE candidates
            const hCandRef = ref(db, `rooms/${c}/hostCandidates`);
            onChildAdded(hCandRef, (candSnap) => {
              if (pcRef.current !== pc) return;
              pc.addIceCandidate(
                new RTCIceCandidate(
                  candSnap.val() as RTCIceCandidateInit
                )
              ).catch(() => {});
            });
            fbUnsub.current.push(() => off(hCandRef));
          } catch {
            clearTimer();
            setError("connection failed — please try again");
            setStatus("error");
            teardown();
          }
        };

        await tryGetOffer();
      } catch {
        clearTimer();
        setError("network error — please try again");
        setStatus("error");
      }
    },
    [teardown, send]
  );

  // ── move / cmd ──────────────────────────────────────────────────────────────

  const move = useCallback(
    (index: number) => {
      if (gameRef.current.turn !== myMarkRef.current) return;
      if (myMarkRef.current === "X") hostApply({ type: "move", index });
      else send({ t: "move", index });
    },
    [hostApply, send]
  );

  const cmd = useCallback(
    (c: "newRound" | "reset") => {
      if (myMarkRef.current === "X") hostApply({ type: c });
      else send({ t: "cmd", cmd: c });
    },
    [hostApply, send]
  );

  return {
    status,
    code,
    myName,
    names,
    myMark,
    error,
    game,
    signalOk,
    disconnectReason,
    host,
    join,
    move,
    cmd,
    leave,
  };
}
