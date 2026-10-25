import { AnimatePresence, motion } from "framer-motion";
import type { Scores } from "../game/useTicTacToe";
import { cn } from "../utils/cn";

interface StatProps {
  value: number;
  label: string;
  numClass?: string;
  dotClass?: string;
}

function Stat({ value, label, numClass, dotClass }: StatProps) {
  return (
    <div className="flex w-24 flex-col items-center gap-1.5">
      <div className="relative flex h-12 w-full items-center justify-center">
        <AnimatePresence initial={false}>
          <motion.span
            key={String(value)}
            initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={cn("absolute font-serif text-5xl leading-none tabular-nums", numClass)}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex w-full items-center justify-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} />
        <span className="max-w-[86px] truncate text-[10px] font-semibold lowercase tracking-[0.2em] text-ink/45">
          {label}
        </span>
      </div>
    </div>
  );
}

interface ScoreboardProps {
  scores: Scores;
  names: { X: string; O: string };
}

export function Scoreboard({ scores, names }: ScoreboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
      className="flex items-center gap-4 sm:gap-5"
    >
      <Stat value={scores.X} label={names.X} numClass="text-coral" dotClass="bg-coral" />
      <span className="h-10 w-px bg-ink/10" />
      <Stat value={scores.draws} label="draws" numClass="text-ink/80" dotClass="bg-ink/30" />
      <span className="h-10 w-px bg-ink/10" />
      <Stat value={scores.O} label={names.O} numClass="text-pine" dotClass="bg-pine" />
    </motion.div>
  );
}
