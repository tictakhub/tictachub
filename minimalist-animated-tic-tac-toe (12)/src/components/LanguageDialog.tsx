import { motion } from "framer-motion";
import type { Lang } from "../game/roasts";
import { cn } from "../utils/cn";
import { BackRow } from "./BackRow";

interface LanguageDialogProps {
  onSelect: (lang: Lang) => void;
  onBack?: () => void;
}

export function LanguageDialog({ onSelect, onBack }: LanguageDialogProps) {
  return (
    <div className="fixed inset-0 z-[55] grid place-items-center px-5">
      {/* backdrop fades in on its own, slightly ahead of the card */}
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
        className="relative w-full max-w-[330px] rounded-3xl bg-paper p-6 shadow-[0_40px_80px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10"
      >
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-ink/45">
          select the language
        </p>
        <p className="mt-2 text-center font-serif text-[15px] italic leading-snug text-ink/55">
          we've got something.......
        </p>

        <div className="mt-5 space-y-2.5">
          {(["en", "ml"] as Lang[]).map((id, i) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center rounded-2xl bg-cream py-4 text-[15px] font-semibold ring-1 ring-ink/10 transition-colors hover:bg-ink/[0.06] hover:ring-ink/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
            >
              <span className={cn(id === "ml" && "font-mal")}>
                {id === "en" ? "English" : "മലയാളം"}
              </span>
            </motion.button>
          ))}
        </div>

        {onBack && <BackRow onBack={onBack} delay={0.32} />}
      </motion.div>
    </div>
  );
}
