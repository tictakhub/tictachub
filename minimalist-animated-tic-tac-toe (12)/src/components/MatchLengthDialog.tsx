import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { cn } from "../utils/cn";
import { BackRow } from "./BackRow";

/** number of round WINS needed to take the series — `0` means play forever */
export type SeriesTarget = 0 | 2 | 3 | 5;

interface MatchLengthDialogProps {
  onSelect: (target: SeriesTarget) => void;
  onBack?: () => void;
}

export const MATCH_OPTIONS: { target: SeriesTarget; label: string; sub: string }[] = [
  { target: 2, label: "best of 3", sub: "first to 2 wins" },
  { target: 3, label: "best of 5", sub: "first to 3 wins" },
  { target: 5, label: "best of 9", sub: "first to 5 wins" },
  { target: 0, label: "unlimited", sub: "play till you drop" },
];

const OPTIONS = MATCH_OPTIONS;

export function MatchLengthDialog({ onSelect, onBack }: MatchLengthDialogProps) {
  return (
    <div className="fixed inset-0 z-[54] grid place-items-center overflow-y-auto px-5 py-8">
      <motion.div
        className="absolute inset-0 bg-ink/30"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />

      <motion.div
        initial={{ scale: 0.9, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.06 }}
        className="relative w-full max-w-[350px] rounded-3xl bg-paper p-6 shadow-[0_40px_80px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -35 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.14 }}
          className="mx-auto mb-3.5 grid h-10 w-10 place-items-center rounded-2xl bg-ink text-paper shadow-[0_14px_26px_-12px_rgba(25,21,16,0.7)]"
        >
          <Trophy className="h-[18px] w-[18px]" strokeWidth={2.15} />
        </motion.div>

        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-ink/45">
          match length
        </p>
        <p className="mt-2 text-center font-serif text-[15px] italic leading-snug text-ink/55">
          how many rounds to crown a champion?
        </p>

        <div className="mt-5 space-y-2.5">
          {OPTIONS.map((opt, i) => (
            <motion.button
              key={opt.target}
              type="button"
              onClick={() => onSelect(opt.target)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "group flex w-full items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3.5 text-left ring-1 ring-ink/10 transition-colors",
                "hover:bg-ink/[0.06] hover:ring-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
              )}
            >
              <span className="min-w-0">
                <span className="block text-[14.5px] font-semibold leading-tight lowercase">
                  {opt.label}
                </span>
                <span className="mt-0.5 blockatext-[11px] text-ink/45">{opt.sub}</span>
              </span>
              <span className="shrink-0 text-ink/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-ink/60">
                →
              </span>
            </motion.button>
          ))}
        </div>

        {onBack && <BackRow onBack={onBack} delay={0.44} />}
      </motion.div>
    </div>
  );
}
