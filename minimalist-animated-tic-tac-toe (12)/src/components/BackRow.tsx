import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface BackRowProps {
  onBack: () => void;
  label?: string;
  /** entrance delay so it lands after the panel content */
  delay?: number;
}

/** shared "go back one step" link used across the setup dialogs */
export function BackRow({ onBack, label = "back", delay = 0.4 }: BackRowProps) {
  return (
    <motion.button
      type="button"
      onClick={onBack}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      whileTap={{ scale: 0.95 }}
      className="group mx-auto mt-5 flex items-center gap-1.5 text-[11px] font-medium lowercase tracking-[0.26em] text-ink/40 transition-colors hover:text-ink focus:outline-none"
    >
      <ArrowLeft
        className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5"
        strokeWidth={2.5}
      />
      {label}
    </motion.button>
  );
}
