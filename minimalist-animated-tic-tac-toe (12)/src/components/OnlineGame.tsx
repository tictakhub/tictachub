import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Equal, Grid3x3, LogOut, RotateCcw, Sparkles, Wifi } from "lucide-react";
import type { useOnlineSession } from "../game/useOnline";
import type { GameState } from "../game/engine";
import { getWinInfo, type Board, type Player } from "../game/logic";
import type { Lang } from "../game/roasts";
import { sfx } from "../game/sound";
import { useMoveQuip } from "../game/useMoveQuip";
import { cn } from "../utils/cn";
import { Celebration } from "./Celebration";
import { Cell } from "./Cell";
import { Confetti } from "./Confetti";
import { MoveQuip } from "./MoveQuip";
import { Scoreboard } from "./Scoreboard";
import { SeriesChampion } from "./SeriesChampion";
import { SeriesNotice } from "./SeriesNotice";
import { WinLine } from "./WinLine";

type Session = ReturnType<typeof useOnlineSession>;

interface OnlineGameProps {
  session: Session;
  lang: Lang;
  onLeave: () => void;
}

const filled = (b: Board) => b.reduce((n, v) => n + (v ? 1 : 0), 0);

/** play sounds by diffing state snapshots — keeps both screens in sonic sync */
function useSnapshotSfx(game: GameState) {
  const prev = useRef<GameState | null>(null);
  useEffect(() => {
    const p = prev.current;
    const n = game;
    if (p && p !== n) {
      const pWin = getWinInfo(p.board);
      const nWin = getWinInfo(n.board);
      const pDraw = !pWin && p.board.every(Boolean);
      const nDraw = !nWin && n.board.every(Boolean);
      if (!pWin && nWin) sfx.win();
      else if (!pDraw && nDraw) sfx.draw();
      else if (filled(n.board) > filled(p.board)) sfx.move(p.turn);
      if (n.round !== p.round) sfx.ui();
    }
    prev.current = n;
  }, [game]);
}

export function OnlineGame({ session, lang, onLeave }: OnlineGameProps) {
  const { game } = session;
  const [celebrateKey, setCelebrateKey] = useState<number | null>(null);
  useSnapshotSfx(game);
  const quip = useMoveQuip(game.board, lang);

  const win = getWinInfo(game.board);
  const isDraw = !win && game.board.every(Boolean);
  const ended = !!win || isDraw;
  const myTurn = !ended && session.myMark !== null && game.turn === session.myMark;

  const names = session.names ?? { X: "…", O: "…" };
  const scores = game.scores;
  const wins = scores.X + scores.O;

  /* series champion — first to `target` round wins. 0 = endless */
  const goal = game.target;
  const champion: Player | null =
    goal > 0 ? (scores.X >= goal ? "X" : scores.O >= goal ? "O" : null) : null;

  const celebrating = celebrateKey === game.round && ended && !champion;

  useEffect(() => {
    if (ended) {
      const t = setTimeout(() => setCelebrateKey(game.round), 1050);
      return () => clearTimeout(t);
    }
    setCelebrateKey(null);
  }, [ended, game.round]);

  const statusKey = ended
    ? `ended-${win?.winner ?? "draw"}-${wins + scores.draws}-${game.round}`
    : `turn-${game.turn}-${game.round}`;

  return (
    <motion.div
      className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-paper text-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
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
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-blush/15 blur-[110px]" />

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
          className="flex items-center gap-2.5"
        >
          <span className="flex items-center gap-2 rounded-full bg-cream/70 px-3 py-2 ring-1 ring-ink/10 backdrop-blur">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-pine"
              animate={{ scale: [1, 1.6, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="hidden max-w-[220px] items-center gap-1.5 truncate text-[11px] font-medium lowercase tracking-wide sm:flex">
              <span className="text-coral">{names.X}</span>
              <span className="text-ink/30">vs</span>
              <span className="text-pine">{names.O}</span>
            </span>
            <Wifi className="h-3.5 w-3.5 text-pine" strokeWidth={2.25} />
          </span>

          <span className="hidden text-[11px] font-medium uppercase tracking-[0.3em] text-ink/40 tabular-nums md:block">
            round {String(game.round).padStart(2, "0")}
          </span>

          <motion.button
            type="button"
            onClick={onLeave}
            whileTap={{ scale: 0.88 }}
            aria-label="leave match"
            title="leave match"
            className="grid h-9 w-9 place-items-center rounded-full bg-cream/70 ring-1 ring-ink/10 backdrop-blur transition-colors hover:bg-coral/10 hover:text-coral hover:ring-coral/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
          >
            <LogOut className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </header>

      {/* main stage */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-5 pt-1 sm:gap-7 sm:px-5 sm:pb-8 sm:pt-2">
        <Scoreboard scores={scores} names={names} />

        {goal > 0 && <SeriesNotice target={goal} scores={scores} names={names} />}

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
              {!ended && myTurn && (
                <>
                  <motion.span
                    className={cn("h-2 w-2 rounded-full", game.turn === "X" ? "bg-coral" : "bg-pine")}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="font-serif italic text-ink/75">your move,</span>
                  <span
                    className={cn(
                      "max-w-[160px] truncate text-base font-bold tracking-wide",
                      game.turn === "X" ? "text-coral" : "text-pine"
                    )}
                  >
                    {names[game.turn]}
                  </span>
                </>
              )}
              {!ended && !myTurn && (
                <>
                  <span
                    className="max-w-[140px] truncate text-base font-bold tracking-wide"
                    style={{ color: game.turn === "X" ? "var(--color-coral)" : "var(--color-pine)" }}
                  >
                    {names[game.turn]}
                  </span>
                  <span className="font-serif italic text-ink/70">is plotting</span>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-ink/35"
                      animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                    />
                  ))}
                </>
              )}
              {ended && win && (
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
              {ended && isDraw && !win && (
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
            !myTurn && !ended && "opacity-[0.97]"
          )}
        >
          {/* "you are" tag */}
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn(
              "absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-1 text-[10px] font-bold lowercase tracking-[0.2em] text-cream shadow-[0_10px_20px_-10px_rgba(25,21,16,0.5)]",
              session.myMark === "X" ? "bg-coral" : "bg-pine"
            )}
          >
            you are {session.myMark}
          </motion.span>

          <MoveQuip quip={quip} lang={lang} />

          <div className="relative grid aspect-square grid-cols-3 gap-2.5">
            {game.board.map((sq, i) => (
              <Cell
                key={i}
                index={i}
                value={sq}
                turn={game.turn}
                control={session.myMark ?? "none"}
                isWinning={!!win && win.line.includes(i)}
                winner={win?.winner ?? null}
                dimmed={(!!win && !!sq && !win.line.includes(i)) || (ended && !sq)}
                disabled={ended || !myTurn}
                onPlace={session.move}
              />
            ))}

            <AnimatePresence>
              {win && <WinLine key={`line-${game.round}`} line={win.line} winner={win.winner} />}
            </AnimatePresence>
            <AnimatePresence>
              {ended && !!win && <Confetti key={`confetti-${wins}`} trigger={wins} />}
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
            onClick={() => session.cmd("newRound")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className={cn(
              "group flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold lowercase tracking-wide text-paper shadow-[0_16px_32px_-14px_rgba(25,21,16,0.55)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
              !ended && "bg-ink hover:bg-coral",
              ended && win?.winner === "X" && "bg-coral hover:bg-ink",
              ended && win?.winner === "O" && "bg-pine hover:bg-ink",
              ended && !win && "bg-ink hover:bg-amber"
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
              {(scores.X > 0 || scores.O > 0 || scores.draws > 0) && (
                <motion.button
                  type="button"
                  onClick={() => session.cmd("reset")}
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
            <span className="text-ink/20">·</span>
            <motion.button
              type="button"
              onClick={onLeave}
              className="text-[11px] font-medium lowercase tracking-[0.28em] text-ink/40 transition-colors hover:text-coral focus:outline-none"
            >
              leave match
            </motion.button>
          </div>
        </motion.div>
      </main>

      {/* footer */}
      <footer className="relative z-10 border-t border-ink/[0.07] px-6 py-3.5 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-[10px] font-medium uppercase tracking-[0.32em] text-ink/35"
        >
          real-time duel · peer to peer
        </motion.p>
      </footer>

      {/* series champion */}
      <AnimatePresence>
        {champion && (
          <SeriesChampion
            key={`champion-${champion}-${wins}`}
            champion={champion}
            name={names[champion]}
            loserName={names[champion === "X" ? "O" : "X"]}
            scores={scores}
            target={goal}
            lang={game.roastLang || lang}
            roastText={game.champRoast}
            onRematch={() => session.cmd("reset")}
            onStartOver={onLeave}
          />
        )}
      </AnimatePresence>

      {/* full-screen celebration */}
      <AnimatePresence>
        {celebrating && (
          <Celebration
            key={`celebration-${game.round}`}
            winner={win ? win.winner : "draw"}
            names={names}
            scores={scores}
            lang={lang}
            onNewGame={() => session.cmd("newRound")}
          />
        )}
      </AnimatePresence>

      {/* opponent left */}
      <AnimatePresence>
        {session.status === "closed" && (
          <motion.div
            key="closed"
            className="fixed inset-0 z-[46] grid place-items-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink/30 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.9, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 }}
              className="relative flex w-full max-w-[340px] flex-col items-center gap-3 rounded-[1.75rem] bg-paper p-8 text-center shadow-[0_40px_80px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink/8 text-ink/60 ring-1 ring-ink/10">
                <Wifi className="h-5 w-5" strokeWidth={2} />
              </span>
              <h3 className="font-serif text-2xl italic tracking-tight">signal lost</h3>
              <p className="text-[13px] leading-relaxed text-ink/55">
                your opponent left the match. better luck with the next one.
              </p>
              <motion.button
                type="button"
                onClick={onLeave}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                className="mt-2 flex items-center gap-2 rounded-full bg-ink px-7 py-3 text-sm font-semibold lowercase tracking-wide text-paper shadow-[0_16px_30px_-14px_rgba(25,21,16,0.55)] transition-colors hover:bg-coral focus:outline-none"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
                back to local duel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
