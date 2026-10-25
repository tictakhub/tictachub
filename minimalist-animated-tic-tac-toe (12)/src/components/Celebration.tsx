import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Equal, Flame, Trophy } from "lucide-react";
import type { Player } from "../game/logic";
import { pickRoast, ROAST_LABEL, type Lang } from "../game/roasts";
import type { Scores } from "../game/useTicTacToe";
import { cn } from "../utils/cn";
import { Confetti } from "./Confetti";

interface CelebrationProps {
  winner: Player | "draw";
  names: { X: string; O: string };
  scores: Scores;
  lang: Lang;
  /** pre-generated roast (synced from the host in online play) */
  roastText?: string;
  onNewGame: () => void;
}

const COLOR: Record<CelebrationProps["winner"], string> = {
  X: "#E8552F",
  O: "#17705C",
  draw: "#D97706",
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function Celebration({
  winner,
  names,
  scores,
  lang,
  roastText,
  onNewGame,
}: CelebrationProps) {
  const reduce = useReducedMotion();
  const isDraw = winner === "draw";
  const accent = COLOR[winner];
  const burstKey = scores.X + scores.O + scores.draws;

  const loserName = isDraw ? "" : names[winner === "X" ? "O" : "X"];

  /* one roast per round — a fresh, non-repeating line each time this mounts */
  /* online: the host's roast arrives pre-generated so both players read the same line */
  const [ownRoast] = useState(() => pickRoast(loserName, isDraw, lang));
  const roast = roastText ?? ownRoast;

  /** the loser's name, bolded + tinted so there's no doubt who's cooked */
  const roastBody = useMemo(() => {
    if (!loserName || !roast.includes(loserName)) return roast;
    const parts = roast.split(loserName);
    return (
      <>
        {parts[0]}
        <b style={{ color: "#D97706" }}>{loserName}</b>
        {parts.slice(1).join(loserName)}
      </>
    );
  }, [roast, loserName]);

  const flecks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: rand(4, 94),
        top: rand(12, 88),
        size: rand(3, 7),
        dx: rand(-20, 20),
        dy: rand(-70, -30),
        dur: rand(4, 8),
        delay: rand(0, 3),
        shape: i % 3,
        tint: ["#E8552F", "#17705C", "#D97706", "#FDFBF5"][i % 4],
      })),
    []
  );

  return (
    <motion.div
      className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* glass backdrop — a single fixed layer, no filter animations on it */}
      <div
        aria-hidden
        className="fixed inset-0"
        style={{
          background: `linear-gradient(rgba(25,21,16,0.55), rgba(25,21,16,0.55)), radial-gradient(ellipse 75% 60% at 50% 38%, ${accent}30, transparent 75%)`,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      />

      {/* confetti wrapped in its own stacking context so it stays behind the text */}
      <div aria-hidden className="fixed inset-0 z-0">
        <Confetti trigger={burstKey} />
      </div>

      {/* drifting flecks */}
      {!reduce &&
        flecks.map((f, i) => (
          <span
            key={i}
            aria-hidden
            className="fixed block"
            style={{ left: `${f.left}%`, top: `${f.top}%`, width: f.size, height: f.size }}
          >
            <motion.span
              className="block h-full w-full"
              initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
              animate={{ x: f.dx, y: f.dy, rotate: 90, opacity: [0, 0.5, 0] }}
              transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: "easeInOut" }}
              style={
                f.shape === 1
                  ? { border: `1.5px solid ${f.tint}`, borderRadius: 999 }
                  : f.shape === 2
                    ? { backgroundColor: f.tint, width: 2.5, borderRadius: 999 }
                    : { backgroundColor: f.tint, borderRadius: 999 }
              }
            />
          </span>
        ))}

      {/* content — a real flex column, my-auto centers without clipping when tall */}
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[470px] flex-col items-center px-4 py-8">
        <div className="my-auto flex w-full flex-col items-center text-center">
          {/* medal */}
          <motion.div
            initial={{ scale: 0, rotate: -60, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
            className="relative grid h-20 w-20 place-items-center sm:h-28 sm:w-28"
          >
            <motion.span
              aria-hidden
              className="absolute inset-[-14px] rounded-full border border-dashed border-white/40"
              animate={reduce ? undefined : { rotate: 360 }}
              transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            />
            {!reduce && (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{ border: `1.5px solid ${accent}` }}
                animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
              />
            )}
            <span
              className="grid h-full w-full place-items-center rounded-full ring-1 ring-white/30"
              style={{
                background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.32), rgba(255,255,255,0.1) 55%, ${accent}26)`,
                boxShadow: `0 0 60px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            >
              {isDraw ? (
                <Equal className="h-8 w-8 text-white/80 sm:h-11 sm:w-11" strokeWidth={2.25} />
              ) : (
                <Trophy
                  className="h-8 w-8 sm:h-11 sm:w-11"
                  style={{ color: accent }}
                  strokeWidth={1.9}
                />
              )}
            </span>
          </motion.div>

          {/* the name */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.28 }}
            className="mt-5 w-full truncate font-serif text-4xl italic leading-tight sm:mt-7 sm:text-6xl"
            style={{ color: accent }}
          >
            {isDraw ? "it's a draw" : names[winner]}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
            className="mt-2 text-[10px] font-semibold uppercase tracking-[0.38em] text-white/60 sm:text-[11px]"
          >
            {isDraw ? "perfectly balanced" : "wins the round"}
          </motion.p>

          {/* score recap */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.52 }}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/20 sm:px-5"
          >
            <span
              className="max-w-[110px] truncate text-[12px] font-semibold lowercase tracking-wide"
              style={{ color: "#E8552F" }}
            >
              {names.X} <span className="font-serif text-base tabular-nums">{scores.X}</span>
            </span>
            <span className="text-white/30">—</span>
            <span
              className="max-w-[110px] truncate text-[12px] font-semibold lowercase tracking-wide"
              style={{ color: "#17705C" }}
            >
              <span className="font-serif text-base tabular-nums">{scores.O}</span> {names.O}
            </span>
          </motion.div>

          {/* THE ROAST — always mounted, transform/opacity only (no filter + backdrop-blur clash) */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.72 }}
            className="mt-4 flex w-full items-stretch gap-2.5 rounded-2xl bg-white/12 p-3 ring-1 ring-white/20 sm:gap-3"
          >
            <motion.span
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.8 }}
              className="grid h-8 w-8 shrink-0 place-items-center self-center rounded-full bg-[#D97706]/25"
            >
              <motion.span
                animate={reduce ? undefined : { scale: [1, 1.18, 1], rotate: [0, -8, 6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="grid place-items-center"
              >
                <Flame className="h-4 w-4" style={{ color: "#D97706" }} strokeWidth={2.25} />
              </motion.span>
            </motion.span>

            <div className="min-w-0 flex-1 text-left">
              <span
                className={cn(
                  "block text-[9.5px] font-bold text-[#D97706]",
                  lang === "ml" ? "font-mal tracking-[0.14em]" : "uppercase tracking-[0.28em]"
                )}
              >
                {isDraw ? ROAST_LABEL[lang].draw : ROAST_LABEL[lang].round}
              </span>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.85 }}
                className={cn(
                  "mt-1 font-medium text-white/90",
                  lang === "ml"
                    ? "font-mal text-[13.5px] sm:text-[14.5px]"
                    : "text-[13px] leading-snug sm:text-[13.5px]"
                )}
              >
                {roastBody}
              </motion.p>
            </div>
          </motion.div>

          {/* new game — centered */}
          <motion.button
            type="button"
            onClick={onNewGame}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.62 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "group mx-auto mt-5 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold lowercase tracking-wide text-white shadow-[0_22px_44px_-18px_rgba(0,0,0,0.6)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:px-9",
              winner === "X" && "bg-coral hover:bg-white hover:text-coral",
              winner === "O" && "bg-pine hover:bg-white hover:text-pine",
              isDraw && "bg-ink hover:bg-white hover:text-ink"
            )}
          >
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={2.5}
            />
            next round
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-3 text-[10px] lowercase tracking-[0.28em] text-white/40"
          >
            round {scores.X + scores.O + scores.draws} complete
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
