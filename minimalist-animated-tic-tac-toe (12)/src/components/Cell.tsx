import { motion, type Transition } from "framer-motion";
import type { Player, Square } from "../game/logic";
import { cn } from "../utils/cn";
import { Mark } from "./Mark";

interface CellProps {
  index: number;
  value: Square;
  turn: Player;
  /** who may place marks here: "both" for local play, a mark for online play, "none" to lock */
  control?: Player | "both" | "none";
  isWinning: boolean;
  winner: Player | null;
  dimmed: boolean;
  disabled: boolean;
  onPlace: (index: number) => void;
}

const entrance = (index: number): Transition => ({
  type: "spring",
  stiffness: 360,
  damping: 27,
  delay: 0.22 + index * 0.05,
});

const winPop: Transition = { type: "spring", stiffness: 420, damping: 18, delay: 0.52 };

export function Cell({
  index,
  value,
  turn,
  control = "both",
  isWinning,
  winner,
  dimmed,
  disabled,
  onPlace,
}: CellProps) {
  const interactive =
    !value && !disabled && control !== "none" && (control === "both" || control === turn);

  return (
    <motion.button
      type="button"
      aria-label={`cell ${index + 1}${value ? `, ${value}` : ""}`}
      initial={{ opacity: 0, scale: 0.4, y: 22 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={entrance(index)}
      whileHover={interactive ? { y: -5, scale: 1.05 } : undefined}
      whileTap={interactive ? { scale: 0.86 } : undefined}
      onClick={() => onPlace(index)}
      className={cn(
        "group relative aspect-square rounded-2xl bg-cream shadow-[0_1px_2px_rgba(25,21,16,0.06),0_14px_28px_-16px_rgba(25,21,16,0.18)] ring-1 ring-ink/10 transition-opacity duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60",
        isWinning && winner === "X" && "bg-coral/10 ring-coral/40",
        isWinning && winner === "O" && "bg-pine/10 ring-pine/40",
        dimmed && "opacity-40",
        interactive ? "cursor-pointer" : "cursor-default"
      )}
    >
      {interactive && (
        <>
          {/* hover ring tinted by the player to move */}
          <span
            className={cn(
              "pointer-events-none absolute inset-0 rounded-2xl ring-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
              turn === "X" ? "ring-coral/45" : "ring-pine/45"
            )}
          />
          {/* ghost preview of the mark you're about to place */}
          <span className="pointer-events-none absolute inset-[17%] scale-90 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-[0.14]">
            <Mark player={turn} ghost />
          </span>
        </>
      )}

      {value && (
        <motion.span
          className="pointer-events-none absolute inset-[15%]"
          animate={isWinning ? { scale: [1, 1.16, 1] } : { scale: 1 }}
          transition={winPop}
        >
          <Mark player={value} />
        </motion.span>
      )}
    </motion.button>
  );
}
