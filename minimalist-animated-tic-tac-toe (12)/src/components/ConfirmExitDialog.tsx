import { motion } from "framer-motion";
import { LogOut } from "lucide-react";

interface ConfirmExitDialogProps {
  /** true when there's real progress worth warning about */
  hasProgress: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmExitDialog({ hasProgress, onCancel, onConfirm }: ConfirmExitDialogProps) {
  return (
    <div className="fixed inset-0 z-[57] grid place-items-center px-5">
      <motion.div
        className="absolute inset-0 bg-ink/35"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={onCancel}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.05 }}
        className="relative w-full max-w-[330px] rounded-3xl bg-paper p-6 text-center shadow-[0_40px_80px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 18, delay: 0.12 }}
          className="mx-auto mb-3.5 grid h-10 w-10 place-items-center rounded-2xl bg-coral/12 text-coral"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </motion.div>

        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-ink/45">
          leave the match?
        </p>
        <p className="mt-2 text-center font-serif text-[15px] italic leading-snug text-ink/55">
          {hasProgress
            ? "your scores will be wiped clean."
            : "you'll head back to the start."}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <motion.button
            type="button"
            onClick={onConfirm}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-coral py-3.5 text-[14px] font-semibold lowercase tracking-wide text-cream shadow-[0_16px_30px_-14px_rgba(232,85,47,0.7)] transition-colors hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60"
          >
            yes, exit
          </motion.button>

          <motion.button
            type="button"
            autoFocus
            onClick={onCancel}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-cream py-3.5 text-[14px] font-semibold lowercase tracking-wide text-ink/70 ring-1 ring-ink/10 transition-colors hover:bg-ink/[0.06] hover:text-ink hover:ring-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
          >
            keep playing
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
