import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Equal, Grid3x3, LogOut, RotateCcw, Sparkles, UserRound, Volume2, VolumeX } from "lucide-react";
import { Celebration } from "./components/Celebration";
import { Cell } from "./components/Cell";
import { ConfirmExitDialog } from "./components/ConfirmExitDialog";
import { Confetti } from "./components/Confetti";
import { MoveQuip } from "./components/MoveQuip";
import { LanguageDialog } from "./components/LanguageDialog";
import { LaunchSplash } from "./components/LaunchSplash";
import { MatchLengthDialog, type SeriesTarget } from "./components/MatchLengthDialog";
import { SeriesChampion } from "./components/SeriesChampion";
import { NameDialog, type Names } from "./components/NameDialog";
import { OnlineDialog } from "./components/OnlineDialog";
import { OnlineGame } from "./components/OnlineGame";
import type { Lang } from "./game/roasts";
import { Scoreboard } from "./components/Scoreboard";
import { SeriesNotice } from "./components/SeriesNotice";
import { WelcomeDialog } from "./components/WelcomeDialog";
import { WinLine } from "./components/WinLine";
import { setSoundMuted, sfx } from "./game/sound";
import { useMoveQuip } from "./game/useMoveQuip";
import { ROOM_CODE_LENGTH, useOnlineSession } from "./game/useOnline";
import { useTicTacToe } from "./game/useTicTacToe";
import { cn } from "./utils/cn";

const DEFAULT_NAMES: Names = { X: "Player X", O: "Player O" };

/**
 * Read the room code from the URL *fragment* (`#room=…`).
 * Fragments are never sent to servers, so invite links stay private —
 * they can't leak into access logs, analytics, or Referer headers.
 */
function readInviteCode(): string {
  if (typeof window === "undefined") return "";
  try {
    const hash = window.location.hash.replace(/^#/, "");
    const raw = new URLSearchParams(hash).get("room") ?? "";
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
    return code.length === ROOM_CODE_LENGTH ? code : "";
  } catch {
    return "";
  }
}

/* nothing is persisted — every visit and refresh starts clean */
function loadNames(): Names {
  return DEFAULT_NAMES;
}

export default function App() {
  const { board, turn, status, win, scores, round, place, newRound, resetAll } = useTicTacToe();
  const [launched, setLaunched] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [names, setNames] = useState<Names>(loadNames);
  const [draft, setDraft] = useState<Names>(loadNames);
  /* step 1 — roast language, asked once at launch */
  const [lang, setLang] = useState<Lang | null>(null);
  /* step 2 — how many round wins take the match */
  const [target, setTarget] = useState<SeriesTarget | null>(null);

  const [dialog, setDialog] = useState<"intro" | "edit" | null>(
    readInviteCode() ? null : "intro"
  );
  const chooseLang = (l: Lang) => {
    setLang(l);
    sfx.ui();
  };

  /* online mode */
  const online = useOnlineSession();
  const [view, setView] = useState<"local" | "online">("local");
  const [invite] = useState(readInviteCode);
  const [onlineDialog, setOnlineDialog] = useState(!!invite);

  /* wipe the invite code from the address bar the moment we've read it,
     so it can't be shoulder-surfed, bookmarked or re-shared by accident */
  useEffect(() => {
    if (invite) {
      try {
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        /* ignore */
      }
    }
  }, [invite]);

  useEffect(() => {
    if (onlineDialog && online.status === "connected") {
      setOnlineDialog(false);
      setView("online");
    }
  }, [onlineDialog, online.status]);

  useEffect(() => {
    if (view === "online" && (online.status === "idle" || online.status === "error")) {
      setView("local");
    }
  }, [view, online.status]);

  const openOnline = () => {
    sfx.ui();
    setOnlineDialog(true);
  };

  const leaveOnline = () => {
    online.leave();
    setView("local");
  };

  /* the local board is interactive only once fully set up and not in a room */
  const started =
    dialog === null &&
    lang !== null &&
    target !== null &&
    welcomed &&
    view === "local" &&
    !onlineDialog;

  const [confirmExit, setConfirmExit] = useState(false);

  /* esc dismisses the exit confirmation */
  useEffect(() => {
    if (!confirmExit) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmExit(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmExit]);

  /** back to the very start — match length, language, names */
  /** exit returns players to the match length step, keeping names + language */
  const goHome = () => {
    sfx.ui();
    setConfirmExit(false);
    resetAll();
    setLang(null);
    setTarget(null);
  };

  const [celebrateKey, setCelebrateKey] = useState<number | null>(null);
  const quip = useMoveQuip(board, lang ?? "en");

  const wins = scores.X + scores.O;
  const hasAnyScore = wins + scores.draws > 0;
  const ended = status !== "playing";

  /* series champion — first to `target` round wins */
  const goal = target ?? 1;
  const champion: "X" | "O" | null =
    scores.X >= goal ? "X" : scores.O >= goal ? "O" : null;

  const celebrating = celebrateKey === round && ended && !champion;

  useEffect(() => {
    if (ended) {
      const t = setTimeout(() => setCelebrateKey(round), 1050);
      return () => clearTimeout(t);
    }
    setCelebrateKey(null);
  }, [ended, round]);

  const toggleSound = () => {
    setMuted((m) => {
      setSoundMuted(!m);
      if (m) sfx.ui();
      return !m;
    });
  };

  const openEditor = () => {
    setDraft(names);
    setDialog("edit");
    sfx.ui();
  };

  const handleSubmit = (submitted: Names) => {
    setNames(submitted);
    if (dialog === "edit") resetAll();
    setTimeout(() => setDialog(null), 220);
  };

  const statusKey =
    status === "playing"
      ? `turn-${turn}-${round}`
      : status === "won"
        ? `won-${win?.winner}-${wins}`
        : `draw-${scores.draws}`;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-paper text-ink">
      {/* ambient colour wash */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-coral/15 blur-[110px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-44 h-[36rem] w-[36rem] rounded-full bg-pine/15 blur-[110px]"
        animate={{ x: [0, -50, 0], y: [0, -35, 0] }}
        transition={{ duration: 21, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-blush/15 blur-[110px]"
      />
      <div className="grain" />

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3.5 sm:px-8 sm:py-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="flex items-center gap-2.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-paper shadow-[0_10px_22px_-10px_rgba(25,21,16,0.6)]">
            <Grid3x3 className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-semibold lowercase tracking-tight">
            tic <span className="font-serif italic text-coral">tac</span>{" "}
            <span className="font-serif italic text-pine">toe</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.08 }}
          className="flex items-center gap-3"
        >
          <AnimatePresence>
            {started && (
              <motion.button
                type="button"
                onClick={openEditor}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.94 }}
                className="hidden max-w-[210px] items-center gap-2 rounded-full bg-cream/70 py-1.5 pl-2.5 pr-3.5 text-[11px] font-medium lowercase tracking-wide ring-1 ring-ink/10 backdrop-blur transition-colors hover:ring-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 sm:flex"
                title="change players"
              >
                <UserRound className="h-3.5 w-3.5 shrink-0 text-ink/50" strokeWidth={2.25} />
                <span className="truncate">
                  <span className="text-coral">{names.X}</span>
                  <span className="mx-1.5 text-ink/30">vs</span>
                  <span className="text-pine">{names.O}</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          <span className="hidden text-[11px] font-medium uppercase tracking-[0.3em] text-ink/40 tabular-nums md:block">
            round {String(round).padStart(2, "0")}
          </span>
          <motion.button
            type="button"
            aria-label={muted ? "unmute sound" : "mute sound"}
            onClick={toggleSound}
            whileTap={{ scale: 0.88 }}
            className="grid h-9 w-9 place-items-center rounded-full bg-cream/70 ring-1 ring-ink/10 backdrop-blur transition-colors hover:ring-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={muted ? "muted" : "sound"}
                initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0.4, opacity: 0, rotate: 30 }}
                transition={{ duration: 0.15 }}
                className="grid place-items-center"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </header>

      {/* main stage */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-5 pt-1 sm:gap-7 sm:px-5 sm:pb-8 sm:pt-2">
        <Scoreboard scores={scores} names={names} />

        {target !== null && (
          <SeriesNotice target={target} scores={scores} names={names} />
        )}

        {/* status line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex h-9 items-center justify-center"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={statusKey}
              initial={{ y: 14, opacity: 0, filter: "blur(5px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -14, opacity: 0, filter: "blur(5px)" }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex items-center gap-2.5 text-lg"
            >
              {status === "playing" && (
                <>
                  <motion.span
                    className={cn("h-2 w-2 rounded-full", turn === "X" ? "bg-coral" : "bg-pine")}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="font-serif italic text-ink/75">your move,</span>
                  <span
                    className={cn(
                      "max-w-[160px] truncate text-base font-bold tracking-wide",
                      turn === "X" ? "text-coral" : "text-pine"
                    )}
                  >
                    {names[turn]}
                  </span>
                </>
              )}
              {status === "won" && win && (
                <>
                  <Sparkles
                    className="h-[18px] w-[18px] shrink-0"
                    style={{ color: win.winner === "X" ? "var(--color-coral)" : "var(--color-pine)" }}
                  />
                  <span
                    className="max-w-[160px] truncate text-base font-bold tracking-wide"
                    style={{ color: win.winner === "X" ? "var(--color-coral)" : "var(--color-pine)" }}
                  >
                    {names[win.winner]}
                  </span>
                  <span className="font-serif italic text-ink/80">takes the round</span>
                </>
              )}
              {status === "draw" && (
                <>
                  <Equal className="h-4 w-4 text-amber" strokeWidth={2.75} />
                  <span className="font-serif italic text-ink/80">a perfect stalemate</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* board */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 160, damping: 22, delay: 0.05 }}
          className={cn(
            "board-fit relative rounded-[1.75rem] bg-ink/[0.045] p-2.5 shadow-[0_28px_60px_-32px_rgba(25,21,16,0.4)] ring-1 ring-ink/10 transition-all duration-500 sm:p-3",
            !started && "scale-[0.97] opacity-60 blur-[1.5px]"
          )}
        >
          <MoveQuip quip={quip} lang={lang ?? "en"} />

          <div className="relative grid aspect-square grid-cols-3 gap-2.5">
            {board.map((sq, i) => (
              <Cell
                key={i}
                index={i}
                value={sq}
                turn={turn}
                isWinning={!!win && win.line.includes(i)}
                winner={win?.winner ?? null}
                dimmed={(status === "won" && !!sq && !win?.line.includes(i)) || (ended && !sq)}
                disabled={ended || !started}
                onPlace={place}
              />
            ))}

            <AnimatePresence>
              {win && <WinLine key={`line-${round}`} line={win.line} winner={win.winner} />}
            </AnimatePresence>
            <AnimatePresence>
              {status === "won" && <Confetti key={`confetti-${wins}`} trigger={wins} />}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* controls */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24, delay: 0.45 }}
          className="flex flex-col items-center gap-2.5"
        >
          <motion.button
            type="button"
            onClick={newRound}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className={cn(
              "group flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold lowercase tracking-wide text-paper shadow-[0_16px_32px_-14px_rgba(25,21,16,0.55)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              !started && "bg-ink/40",
              started && status === "playing" && "bg-ink hover:bg-coral",
              status === "won" && win?.winner === "X" && "bg-coral hover:bg-ink",
              status === "won" && win?.winner === "O" && "bg-pine hover:bg-ink",
              status === "draw" && "bg-ink hover:bg-amber"
            )}
          >
            <RotateCcw
              className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180"
              strokeWidth={2.5}
            />
            {celebrating ? "next round" : ended ? "play again" : "restart"}
          </motion.button>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {hasAnyScore && (
                <motion.button
                  type="button"
                  onClick={resetAll}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] font-medium lowercase tracking-[0.28em] text-ink/40 transition-colors hover:text-coral focus:outline-none"
                >
                  reset scores
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {hasAnyScore && started && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-ink/20"
                >
                  ·
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {started && (
                <motion.button
                  type="button"
                  onClick={openEditor}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="text-[11px] font-medium lowercase tracking-[0.28em] text-ink/40 transition-colors hover:text-pine focus:outline-none"
                >
                  change players
                </motion.button>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {started && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-ink/20"
                >
                  ·
                </motion.span>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {started && (
                <motion.button
                  type="button"
                  onClick={() => {
                    sfx.ui();
                    setConfirmExit(true);
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-[11px] font-medium lowercase tracking-[0.28em] text-ink/40 transition-colors hover:text-coral focus:outline-none"
                >
                  <LogOut className="h-3 w-3" strokeWidth={2.5} />
                  exit
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* full-screen celebration */}
      <AnimatePresence>
        {celebrating && (
          <Celebration
            key={`celebration-${round}`}
            winner={win ? win.winner : "draw"}
            names={names}
            scores={scores}
            lang={lang ?? "en"}
            onNewGame={newRound}
          />
        )}
      </AnimatePresence>

      {/* footer */}
      <footer className="relative z-10 border-t border-ink/[0.07] px-6 py-3.5 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-[10px] font-medium uppercase tracking-[0.32em] text-ink/35"
        >
          two players · one grid · zero mercy
        </motion.p>
      </footer>

      {/* launch splash — plays once per page load */}
      <AnimatePresence>
        {!launched && (
          <LaunchSplash key="splash" onDone={() => setLaunched(true)} />
        )}
      </AnimatePresence>

      {/* step 0 — welcome */}
      <AnimatePresence>
        {launched && !welcomed && (
          <WelcomeDialog
            key="welcome"
            onEnter={() => {
              sfx.ui();
              setWelcomed(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* step 1 — who's playing? */}
      <AnimatePresence>
        {dialog && !onlineDialog && (
          <NameDialog
            key={dialog}
            mode={dialog}
            initial={draft}
            onSubmit={handleSubmit}
            onPlayOnline={openOnline}
            onBack={() => {
              sfx.ui();
              setWelcomed(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* step 2 — match length, after "start on this device" */}
      <AnimatePresence>
        {launched &&
          welcomed &&
          dialog === null &&
          target === null &&
          view === "local" &&
          !onlineDialog && (
            <MatchLengthDialog
              key="match-length"
              onSelect={(t) => {
                setTarget(t);
                sfx.ui();
              }}
              onBack={() => {
                sfx.ui();
                setDialog("intro");
              }}
            />
          )}
      </AnimatePresence>

      {/* step 3 — language, straight after match length */}
      <AnimatePresence>
        {launched &&
          welcomed &&
          dialog === null &&
          target !== null &&
          lang === null &&
          view === "local" &&
          !onlineDialog && (
            <LanguageDialog
              key="lang"
              onSelect={chooseLang}
              onBack={() => {
                sfx.ui();
                setTarget(null);
              }}
            />
          )}
      </AnimatePresence>

      {/* confirm before leaving the match */}
      <AnimatePresence>
        {confirmExit && (
          <ConfirmExitDialog
            key="confirm-exit"
            hasProgress={hasAnyScore}
            onCancel={() => setConfirmExit(false)}
            onConfirm={goHome}
          />
        )}
      </AnimatePresence>

      {/* series champion */}
      <AnimatePresence>
        {champion && view === "local" && (
          <SeriesChampion
            key={`champion-${champion}-${wins}`}
            champion={champion}
            name={names[champion]}
            loserName={names[champion === "X" ? "O" : "X"]}
            scores={scores}
            target={goal}
            lang={lang ?? "en"}
            onRematch={() => {
              // same players, same language, same match length — just a clean slate
              resetAll();
            }}
            onStartOver={goHome}
          />
        )}
      </AnimatePresence>

      {/* online lobby dialog */}
      <AnimatePresence>
        {onlineDialog && (
          <OnlineDialog
            key="online-lobby"
            session={online}
            initialName={myMarkGuess(names)}
            initialCode={invite}
            lang={lang ?? "en"}
            onLangChange={chooseLang}
            onClose={() => {
              online.leave();
              setOnlineDialog(false);
              // arriving from an invite link means no local setup happened yet
              if (invite && dialog === null && view === "local") setDialog("intro");
            }}
          />
        )}
      </AnimatePresence>

      {/* online match screen */}
      <AnimatePresence>
        {view === "online" && (
          <OnlineGame
            key="online-game"
            session={online}
            lang={lang ?? "en"}
            onLeave={leaveOnline}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** prefill the online lobby with the name you used on this device */
function myMarkGuess(names: Names) {
  return names.X !== "Player X" && names.X !== "Player O" ? names.X : names.O !== "Player O" ? names.O : "";
}
