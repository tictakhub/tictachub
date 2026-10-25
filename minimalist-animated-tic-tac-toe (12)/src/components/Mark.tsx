import { motion, useReducedMotion } from "framer-motion";
import type { Player } from "../game/logic";

interface MarkProps {
  player: Player;
  /** static, unanimated version (used for hover ghosts) */
  ghost?: boolean;
}

const stroke = {
  fill: "none",
  strokeWidth: 11,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function Mark({ player, ghost = false }: MarkProps) {
  const reduce = useReducedMotion();
  const still = ghost || reduce;
  const color = player === "X" ? "var(--color-coral)" : "var(--color-pine)";

  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden>
      {player === "X" ? (
        <g>
          <motion.path
            d="M27 27 L73 73"
            stroke={color}
            {...stroke}
            initial={still ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 30, delay: 0.04 }}
          />
          <motion.path
            d="M73 27 L27 73"
            stroke={color}
            {...stroke}
            initial={still ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 30, delay: 0.17 }}
          />
        </g>
      ) : (
        <motion.circle
          cx={50}
          cy={50}
          r={23}
          stroke={color}
          {...stroke}
          style={{ originX: "50%", originY: "50%" }}
          initial={still ? false : { pathLength: 0, opacity: 0, rotate: -100 }}
          animate={{ pathLength: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 190, damping: 24, delay: 0.05 }}
        />
      )}
    </svg>
  );
}
