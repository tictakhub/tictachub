import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { sfx } from "../game/sound";
import { Mark } from "./Mark";

interface LaunchSplashProps {
  onDone: () => void;
}

/** brand-colored words: tic · tac · toe */
const WORDS: { text: string; className: string }[] = [
  { text: "tic", className: "font-sans font-semibold text-ink" },
  { text: "tac", className: "font-serif italic text-coral" },
  { text: "toe", className: "font-serif italic text-pine" },
];

const letterSpring = { type: "spring", stiffness: 320, damping: 24 } as const;

export function LaunchSplash({ onDone }: LaunchSplashProps) {
  const reduce = useReducedMotion();

  /* Unmount once the intro is complete; AnimatePresence handles the fade. */
  useEffect(() => {
    const timer = setTimeout(onDone, reduce ? 550 : 2450);
    return () => clearTimeout(timer);
  }, [onDone, reduce]);

  /* little pops as the marks draw in (silent until first gesture on mobile) */
  useEffect(() => {
    if (reduce) return;
    const t1 = setTimeout(() => sfx.move("X"), 500);
    const t2 = setTimeout(() => sfx.move("O"), 820);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [reduce]);

  /* tap / key to skip */
  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[80] overflow-hidden bg-paper"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.15 : 0.42, ease: "easeOut" }}
    >
      {/* brand glow via cheap radial gradients — no blur filters */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70vmax circle at 18% 14%, rgba(232,85,47,0.16), transparent 55%)," +
            "radial-gradient(70vmax circle at 84% 88%, rgba(23,112,92,0.16), transparent 55%)," +
            "#f6f2e9",
        }}
      >
        {/* Content settles gently before the screen crossfades. */}
        <motion.div
          className="relative flex h-full w-full transform-gpu flex-col items-center justify-center px-6"
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.35, ease: "easeOut" }}
        >
          {/* mini board duel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 22 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.12 }}
            className="relative grid w-[164px] grid-cols-3 gap-2 p-2.5"
          >
            <div className="relative aspect-square rounded-xl bg-cream shadow-[0_10px_24px_-14px_rgba(25,21,16,0.35)] ring-1 ring-ink/10">
              <span className="pointer-events-none absolute inset-[16%]">
                <Mark player="X" ghost={!!reduce} />
              </span>
            </div>
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
            <div className="relative aspect-square rounded-xl bg-cream shadow-[0_10px_24px_-14px_rgba(25,21,16,0.35)] ring-1 ring-ink/10">
              <span className="pointer-events-none absolute inset-[16%]">
                <Mark player="O" ghost={!!reduce} />
              </span>
            </div>
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
            <div className="aspect-square rounded-xl bg-cream/60 ring-1 ring-ink/[0.06]" />
          </motion.div>

          {/* the title, letter by letter (transform + opacity only) */}
          <div className="mt-7 flex items-baseline justify-center gap-[0.28em] text-[clamp(2.7rem,11vw,5.2rem)] leading-none tracking-tight">
            {WORDS.map((word, wi) => (
              <span key={word.text} className="flex">
                {word.text.split("").map((ch, li) => (
                  <motion.span
                    key={`${wi}-${li}`}
                    initial={{ opacity: 0, y: 34, rotate: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                    transition={{
                      ...letterSpring,
                      delay: (reduce ? 0.15 : 0.72) + (wi * 3 + li) * (reduce ? 0.02 : 0.045),
                    }}
                    className={word.className}
                  >
                    {ch}
                  </motion.span>
                ))}
              </span>
            ))}
          </div>

          {/* underline flourish */}
          <motion.span
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 20, delay: reduce ? 0.3 : 1.35 }}
            className="mt-4 h-[3px] w-40 rounded-full bg-gradient-to-r from-coral/0 via-coral to-pine sm:w-52"
          />

          {/* tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0.35 : 1.5, type: "spring", stiffness: 240, damping: 24 }}
            className="mt-3.5 text-[10.5px] font-medium uppercase tracking-[0.42em] text-ink/40"
          >
            a minimal duel
          </motion.p>

          {/* skip hint */}
          {!reduce && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2.3, times: [0, 0.25, 0.75, 1], delay: 1.1 }}
              className="absolute bottom-7 text-[9.5px] lowercase tracking-[0.3em] text-ink/25"
            >
              tap to skip
            </motion.p>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
