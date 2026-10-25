import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Player } from "../game/logic";

interface WinLineProps {
  line: number[];
  winner: Player;
}

interface Box {
  w: number;
  h: number;
  gapX: number;
  gapY: number;
}

/**
 * Draws the strike-through using the board's *real* geometry.
 * The grid has gaps between cells, so cell centers are NOT at
 * simple thirds — they must account for the gap size.
 */
export function WinLine({ line, winner }: WinLineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const el = ref.current;
    const grid = el?.parentElement;
    if (!el || !grid) return;

    const measure = () => {
      const cs = getComputedStyle(grid);
      setBox({
        w: grid.clientWidth,
        h: grid.clientHeight,
        gapX: parseFloat(cs.columnGap) || 0,
        gapY: parseFloat(cs.rowGap) || 0,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  if (!box || box.w === 0) {
    return <div ref={ref} className="pointer-events-none absolute inset-0 z-10" />;
  }

  const { w, h, gapX, gapY } = box;

  // true cell size once the gaps are removed
  const cellW = (w - 2 * gapX) / 3;
  const cellH = (h - 2 * gapY) / 3;

  const centerX = (i: number) => (i % 3) * (cellW + gapX) + cellW / 2;
  const centerY = (i: number) => Math.floor(i / 3) * (cellH + gapY) + cellH / 2;

  const [a, , c] = line;
  const ax = centerX(a);
  const ay = centerY(a);
  const cx = centerX(c);
  const cy = centerY(c);

  // extend a little past the outer cell centers, scaled to the board
  const dx = cx - ax;
  const dy = cy - ay;
  const len = Math.hypot(dx, dy) || 1;
  const overshoot = Math.min(cellW, cellH) * 0.3;
  const ux = (dx / len) * overshoot;
  const uy = (dy / len) * overshoot;

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-10"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        className="block"
        preserveAspectRatio="none"
      >
        <motion.line
          x1={ax - ux}
          y1={ay - uy}
          x2={cx + ux}
          y2={cy + uy}
          stroke={winner === "X" ? "var(--color-coral)" : "var(--color-pine)"}
          strokeWidth={Math.max(5, Math.min(w, h) * 0.028)}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.42, type: "spring", stiffness: 130, damping: 21 }}
        />
      </svg>
    </motion.div>
  );
}
