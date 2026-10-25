import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface WelcomeDialogProps {
  onEnter: () => void;
}

export function WelcomeDialog({ onEnter }: WelcomeDialogProps) {

  return (
    <div className="fixed inset-0 z-[56] grid place-items-center overflow-y-auto px-5 py-8">
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
        className="relative w-full max-w-[350px] rounded-3xl bg-paper p-7 text-center shadow-[0_40px_80px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10"
      >
        {/* title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="text-[11px] font-semibold uppercase tracking-[0.28em] text-ink/45"
        >
          welcome to
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.22 }}
          className="mt-1.5 text-[30px] font-semibold leading-none tracking-tight"
        >
          tic <span className="font-serif italic text-coral">tac</span>{" "}
          <span className="font-serif italic text-pine">toe</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.34 }}
          className="mx-auto mt-3 max-w-[260px] font-serif text-[15px] italic leading-snug text-ink/55"
        >
          nine squares. one winner. zero mercy.
        </motion.p>

        {/* the funny bit */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.46 }}
          className="mx-auto mt-4 max-w-[270px] text-[13px] font-medium leading-relaxed text-ink/50"
        >
          enjoy the game, own the grid, and prove who's better 🔥
        </motion.p>

        {/* enter */}
        <motion.button
          type="button"
          autoFocus
          onClick={onEnter}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.72 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className="group mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-[14.5px] font-semibold lowercase tracking-wide text-paper shadow-[0_18px_34px_-16px_rgba(25,21,16,0.6)] transition-colors hover:bg-coral focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
        >
          to the game
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </motion.button>
      </motion.div>
    </div>
  );
}
