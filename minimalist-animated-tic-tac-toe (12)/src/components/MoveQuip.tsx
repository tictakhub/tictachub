import { AnimatePresence, motion } from "framer-motion";
import type { Quip } from "../game/useMoveQuip";
import type { Verdict } from "../game/quips";
import type { Lang } from "../game/roasts";
import { cn } from "../utils/cn";

interface MoveQuipProps {
  quip: Quip | null;
  lang: Lang;
}

const STYLE: Record<Verdict, string> = {
  doubleFumble: "bg-coral text-cream",
  missedWin: "bg-[#D97706] text-cream",
  noBlock: "bg-ink text-cream",
  fork: "bg-pine text-cream",
  clutchBlock: "bg-pine text-cream",
  threat: "bg-ink text-cream",
  center: "bg-pine text-cream",
  meh: "bg-ink/45 text-cream",
};

export function MoveQuip({ quip, lang }: MoveQuipProps) {
  const loud = quip?.verdict === "doubleFumble" || quip?.verdict === "fork";
  const quiet = quip?.verdict === "meh";

  return (
    <AnimatePresence>
      {quip && (
        <motion.span
          key={quip.id}
          initial={{ opacity: 0, y: 14, scale: 0.55, rotate: -12 }}
          animate={{
            opacity: quiet ? 0.85 : 1,
            y: 0,
            scale: 1,
            rotate: loud ? [-12, 6, -5, 3, -2] : [-9, 3, -2],
          }}
          exit={{ opacity: 0, y: -16, scale: 0.8, rotate: 4 }}
          transition={{
            type: "spring",
            stiffness: 520,
            damping: 16,
            rotate: { duration: loud ? 0.5 : 0.35 },
          }}
          className={cn(
            "pointer-events-none absolute -top-4 right-1 z-30 whitespace-nowrap rounded-full px-3 py-1.5 font-bold shadow-[0_12px_24px_-10px_rgba(25,21,16,0.65)]",
            quiet ? "text-[10.5px]" : "text-[11px]",
            lang === "ml" && "font-mal text-[11.5px]",
            STYLE[quip.verdict]
          )}
        >
          {/* pulsing halo on the loudest moments */}
          {loud && (
            <motion.span
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full",
                quip.verdict === "fork" ? "bg-pine" : "bg-coral"
              )}
              animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
              transition={{ duration: 0.9, repeat: 1, ease: "easeOut" }}
            />
          )}
          <span className="relative flex items-center gap-1.5">
            <motion.span
              key={`${quip.id}-emoji`}
              initial={{ scale: 0, rotate: -40 }}
              animate={{
                scale: loud ? [0, 1.45, 1] : [0, 1.25, 1],
                rotate: loud ? [-40, 14, 0] : [-30, 8, 0],
              }}
              transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.06 }}
              className="inline-block text-[13px] leading-none"
            >
              {quip.emoji}
            </motion.span>
            {quip.text}
          </span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
