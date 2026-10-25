import { motion } from "framer-motion";
import { Infinity as InfinityIcon, Trophy } from "lucide-react";
import { cn } from "../utils/cn";

interface SeriesNoticeProps {
  /** wins needed to take the match; 0 = unlimited */
  target: number;
  scores: { X: number; O: number; draws: number };
  names: { X: string; O: string };
}

/** one pip per required win, filled as a player banks rounds */
function Pips({ won, target, color }: { won: number; target: number; color: string }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: target }).map((_, i) => {
        const filled = i < won;
        return (
          <motion.span
            key={i}
            initial={false}
            animate={{ scale: filled ? 1 : 0.72, opacity: filled ? 1 : 0.28 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
            className="h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: filled ? color : "currentColor" }}
          />
        );
      })}
    </span>
  );
}

export function SeriesNotice({ target, scores, names }: SeriesNoticeProps) {
  const unlimited = target === 0;

  // how close is anyone to clinching?
  const best = Math.max(scores.X, scores.O);
  const matchPoint = !unlimited && best === target - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.2 }}
      className={cn(
        "flex items-center gap-2.5 rounded-full bg-cream/80 px-3.5 py-1.5 text-ink/60 ring-1 backdrop-blur transition-colors",
        matchPoint ? "ring-coral/40" : "ring-ink/10"
      )}
    >
      {unlimited ? (
        <>
          <InfinityIcon className="h-3.5 w-3.5 shrink-0 text-ink/40" strokeWidth={2.5} />
          <span className="text-[10.5px] font-semibold lowercase tracking-[0.16em]">
            unlimited rounds
          </span>
        </>
      ) : (
        <>
          <Trophy
            className={cn("h-3.5 w-3.5 shrink-0", matchPoint ? "text-coral" : "text-ink/40")}
            strokeWidth={2.25}
          />
          <span className="text-[10.5px] font-semibold lowercase tracking-[0.16em] whitespace-nowrap">
            first to {target}
          </span>

          <span className="h-3 w-px bg-ink/15" />

          {/* per-player progress */}
          <span className="flex items-center gap-1.5">
            <span className="max-w-[52px] truncate text-[10px] font-semibold text-coral">
              {names.X}
            </span>
            <Pips won={scores.X} target={target} color="#E8552F" />
          </span>

          <span className="flex items-center gap-1.5">
            <Pips won={scores.O} target={target} color="#17705C" />
            <span className="max-w-[52px] truncate text-[10px] font-semibold text-pine">
              {names.O}
            </span>
          </span>
        </>
      )}

      {matchPoint && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="ml-0.5 rounded-full bg-coral px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-cream"
        >
          match point
        </motion.span>
      )}
    </motion.div>
  );
}
