import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Flame, Home, RotateCcw } from "lucide-react";
import type { Player } from "../game/logic";
import { pickRoast, ROAST_LABEL, type Lang } from "../game/roasts";
import { cn } from "../utils/cn";
import { Confetti } from "./Confetti";

interface SeriesChampionProps {
  champion: Player;
  name: string;
  /** the series loser — gets roasted */
  loserName: string;
  scores: { X: number; O: number; draws: number };
  target: number;
  lang: Lang;
  /** pre-generated roast (synced from the host in online play) */
  roastText?: string;
  onRematch: () => void;
  /** reset everything back to the launch flow */
  onStartOver: () => void;
}

export function SeriesChampion({
  champion,
  name,
  loserName,
  scores,
  target,
  lang,
  onRematch,
  onStartOver,
}: SeriesChampionProps) {
  const accent = champion === "X" ? "#E8552F" : "#17705C";

  /* series-final roast — aimed at whoever lost the match */
  const [roast] = useState(() => pickRoast(loserName, false, lang));

  const roastBody = useMemo(() => {
    if (!loserName || !roast.includes(loserName)) return roast;
    const parts = roast.split(loserName);
    return (
      <>
        {parts[0]}
        <b style={{ color: "#E9A23B" }}>{loserName}</b>
        {parts.slice(1).join(loserName)}
      </>
    );
  }, [roast, loserName]);

  return (
    <motion.div
      className="fixed inset-0 z-[58] flex overflow-y-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="fixed inset-0"
        style={{
          background: `linear-gradient(rgba(25,21,16,0.62), rgba(25,21,16,0.62)), radial-gradient(ellipse 75% 60% at 50% 38%, ${accent}38, transparent 75%)`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      />

      <div className="pointer-events-none fixed inset-0 z-0">
        <Confetti trigger={scores.X + scores.O + scores.draws} />
      </div>

      <div className="relative z-10 m-auto flex w-full max-w-[440px] flex-col items-center text-center">
        {/* crown */}
        <motion.div
          initial={{ scale: 0, rotate: -50, y: -20 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 15, delay: 0.1 }}
          className="relative grid h-24 w-24 place-items-center sm:h-28 sm:w-28"
        >
          <motion.span
            aria-hidden
            className="absolute inset-[-16px] rounded-full border border-dashed border-white/35"
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          />
          <span
            className="grid h-full w-full place-items-center rounded-full ring-1 ring-white/30"
            style={{
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.34), rgba(255,255,255,0.1) 55%, ${accent}2e)`,
              boxShadow: `0 0 70px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.35)`,
            }}
          >
            <Crown className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: accent }} strokeWidth={1.9} />
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-[10px] font-bold uppercase tracking-[0.42em] text-white/55"
        >
          match champion
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.38 }}
          className="mt-2 w-full truncate font-serif text-5xl italic leading-tight sm:text-6xl"
          style={{ color: accent }}
        >
          {name}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="mt-3 text-[13px] text-white/60"
        >
          took the series {scores[champion]}–{scores[champion === "X" ? "O" : "X"]}
          {scores.draws > 0 && ` · ${scores.draws} draw${scores.draws > 1 ? "s" : ""}`}
        </motion.p>

        {/* series pips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-5 flex items-center gap-1.5"
        >
          {Array.from({ length: target }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.66 + i * 0.08 }}
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: accent }}
            />
          ))}
        </motion.div>

        {/* the series roast — aimed at whoever lost the match */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 230, damping: 22, delay: 0.78 }}
          className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/20"
        >
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.88 }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E9A23B]/25"
          >
            <motion.span
              animate={{ scale: [1, 1.18, 1], rotate: [0, -8, 6, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="grid place-items-center"
            >
              <Flame className="h-4 w-4" style={{ color: "#E9A23B" }} strokeWidth={2.25} />
            </motion.span>
          </motion.span>

          <div className="min-w-0 flex-1 text-left">
            <span
              className={cn(
                "block text-[9.5px] font-bold",
                lang === "ml" ? "font-mal tracking-[0.14em]" : "uppercase tracking-[0.28em]"
              )}
              style={{ color: "#E9A23B" }}
            >
              {ROAST_LABEL[lang].round}
            </span>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.92 }}
              className={cn(
                "mt-1 font-medium text-white/90",
                lang === "ml" ? "font-mal text-[13.5px]" : "text-[13px] leading-snug"
              )}
            >
              {roastBody}
            </motion.p>
          </div>
        </motion.div>

        {/* two actions side by side */}
        <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          {/* restart the game */}
          <motion.button
            type="button"
            onClick={onRematch}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.74 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className={cn(
              "group flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold lowercase tracking-wide text-white shadow-[0_22px_44px_-18px_rgba(0,0,0,0.6)] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
              champion === "X"
                ? "bg-coral hover:bg-white hover:text-coral"
                : "bg-pine hover:bg-white hover:text-pine"
            )}
          >
            <RotateCcw
              className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180"
              strokeWidth={2.5}
            />
            restart the game
          </motion.button>

          {/* home */}
          <motion.button
            type="button"
            onClick={onStartOver}
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.82 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className="group flex items-center justify-center gap-2 rounded-full bg-white/12 px-7 py-3.5 text-sm font-semibold lowercase tracking-wide text-white/80 ring-1 ring-white/25 backdrop-blur transition-colors duration-300 hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Home
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
              strokeWidth={2.5}
            />
            home
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
