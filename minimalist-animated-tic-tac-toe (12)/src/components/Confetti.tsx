import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

const COLORS = ["#E8552F", "#17705C", "#191510", "#D97706"];
const rand = (min: number, max: number) => min + Math.random() * (max - min);

interface ConfettiProps {
  /** changes each win, regenerating the burst */
  trigger: number;
}

export function Confetti({ trigger }: ConfettiProps) {
  const reduce = useReducedMotion();

  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const angle = (i / 42) * Math.PI * 2 + rand(-0.22, 0.22);
        const dist = rand(110, 260);
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          rotate: rand(-300, 300),
          dur: rand(0.85, 1.35),
          delay: 0.4 + rand(0, 0.14),
          size: rand(0.7, 1.25),
          color: COLORS[i % COLORS.length],
          shape: i % 3,
        };
      }),
    // regenerate a fresh burst for every win
    [trigger]
  );

  if (reduce) return null;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ left: "50%", top: "50%" }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: [0, p.x * 0.72, p.x],
            y: [0, p.y * 0.7 - 46, p.y + 56],
            opacity: [1, 1, 0],
            rotate: [0, p.rotate * 0.4, p.rotate],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            times: [0, 0.55, 1],
            ease: ["easeOut", "easeIn"],
          }}
        >
          <motion.span
            className="block"
            initial={{ scale: 0 }}
            animate={{ scale: p.size }}
            transition={{ delay: p.delay, type: "spring", stiffness: 500, damping: 22 }}
          >
            {p.shape === 0 && (
              <span className="block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            )}
            {p.shape === 1 && (
              <span className="block h-[5px] w-[13px] rounded-full" style={{ backgroundColor: p.color }} />
            )}
            {p.shape === 2 && (
              <span
                className="block h-2.5 w-2.5 rounded-full"
                style={{ border: `2.5px solid ${p.color}` }}
              />
            )}
          </motion.span>
        </motion.span>
      ))}
    </motion.div>
  );
}
