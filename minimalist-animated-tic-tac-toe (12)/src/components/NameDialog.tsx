import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Circle, Dices, Swords, Users, X as XIcon } from "lucide-react";
import { BackRow } from "./BackRow";
import { cn } from "../utils/cn";

export interface Names {
  X: string;
  O: string;
}

interface NameDialogProps {
  mode: "intro" | "edit";
  initial: Names;
  onSubmit: (names: Names) => void;
  onPlayOnline: () => void;
  onBack?: () => void;
}



const MAX = 12;

const FALLBACKS: Names = { X: "Player X", O: "Player O" };

const RANDOM = [
  "Ada", "Bo", "Cy", "Dex", "Eli", "Fox", "Gus", "Hana", "Ivo", "Jo",
  "Kai", "Lux", "Milo", "Nova", "Otto", "Pip", "Quinn", "Rio", "Sol", "Tue",
  "Uma", "Vex", "Wren", "Yuki", "Zed",
];

const pick = () => RANDOM[Math.floor(Math.random() * RANDOM.length)];

interface FieldProps {
  id: string;
  label: string;
  icon: ReactNode;
  value: string;
  accent: "coral" | "pine";
  invalid: boolean;
  onChange: (v: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

function Field({ id, label, icon, value, accent, invalid, onChange, inputRef }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/45"
      >
        {icon}
        {label}
      </label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        maxLength={MAX}
        autoComplete="off"
        spellCheck={false}
        placeholder={accent === "coral" ? "Player X" : "Player O"}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-xl bg-cream px-4 py-3 text-[15px] font-medium text-ink shadow-[inset_0_1px_2px_rgba(25,21,16,0.06)] ring-1 transition-all duration-200 outline-none placeholder:text-ink/25 focus:scale-[1.02]",
          invalid
            ? "ring-2 ring-coral/70"
            : accent === "coral"
              ? "ring-ink/10 focus:ring-2 focus:ring-coral/60"
              : "ring-ink/10 focus:ring-2 focus:ring-pine/60"
        )}
      />
    </div>
  );
}

export function NameDialog({
  mode,
  initial,
  onSubmit,
  onPlayOnline,
  onBack,
}: NameDialogProps) {
  const [x, setX] = useState(initial.X);
  const [o, setO] = useState(initial.O);
  const [touched, setTouched] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const xRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => xRef.current?.focus(), 420);
    return () => clearTimeout(t);
  }, []);

  const trimX = x.trim();
  const trimO = o.trim();
  const clash = trimX.length > 0 && trimX.toLowerCase() === trimO.toLowerCase();
  const invalid = clash || (touched && (trimX.length === 0 || trimO.length === 0));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (clash || trimX.length === 0 || trimO.length === 0) return;
    setLeaving(true);
    onSubmit({ X: trimX || FALLBACKS.X, O: trimO || FALLBACKS.O });
  };

  const shuffle = () => {
    let a = pick();
    let b = pick();
    while (b === a) b = pick();
    setX(a);
    setO(b);
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center px-5 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: leaving ? 0.25 : 0.3 }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-ink/25 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        onClick={() => xRef.current?.focus()}
      />

      <motion.form
        onSubmit={submit}
        initial={{ scale: 0.86, y: 34, opacity: 0, rotateX: 8 }}
        animate={{
          scale: leaving ? 0.94 : 1,
          y: leaving ? 14 : 0,
          opacity: leaving ? 0 : 1,
          rotateX: 0,
        }}
        transition={{ type: "spring", stiffness: 210, damping: 24 }}
        style={{ transformPerspective: 900 }}
        className="relative w-full max-w-[400px] rounded-[1.75rem] bg-paper p-7 shadow-[0_40px_90px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10 sm:p-8"
      >
        {/* header */}
        <div className="mb-6 space-y-1.5 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.18 }}
            className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-ink text-paper shadow-[0_14px_26px_-12px_rgba(25,21,16,0.7)]"
          >
            <Swords className="h-5 w-5" strokeWidth={2.25} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, type: "spring", stiffness: 260, damping: 24 }}
            className="font-serif text-[28px] leading-none tracking-tight"
          >
            {mode === "intro" ? "who's playing?" : "switch players"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.34 }}
            className="text-[13px] text-ink/50"
          >
            {mode === "intro"
              ? "both on this device — or invite a friend."
              : "a new match starts fresh with new names."}
          </motion.p>
        </div>

        {/* fields */}
        <div className="space-y-3.5">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.3 }}
          >
            <Field
              id="name-x"
              label="player x"
              icon={<XIcon className="h-3 w-3 text-coral" strokeWidth={3.5} />}
              value={x}
              accent="coral"
              invalid={invalid && (trimX.length === 0 || clash)}
              onChange={setX}
              inputRef={xRef}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: 0.38 }}
          >
            <Field
              id="name-o"
              label="player o"
              icon={<Circle className="h-3 w-3 text-pine" strokeWidth={3} />}
              value={o}
              accent="pine"
              invalid={invalid && (trimO.length === 0 || clash)}
              onChange={setO}
            />
          </motion.div>
        </div>

        {/* error / hint */}
        <div className="mt-3 flex h-4 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={clash ? "clash" : touched && invalid ? "empty" : "hint"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className={cn(
                "text-[11px] font-medium lowercase tracking-wide",
                clash || (touched && invalid) ? "text-coral" : "text-ink/35"
              )}
            >
              {clash
                ? "two players can't share a name"
                : touched && invalid
                  ? "both names are needed"
                  : "enter to start"}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, type: "spring", stiffness: 240, damping: 24 }}
          className="mt-5 flex items-center gap-2.5"
        >
          <motion.button
            type="button"
            onClick={shuffle}
            whileHover={{ scale: 1.07, rotate: -6 }}
            whileTap={{ scale: 0.9, rotate: 6 }}
            className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full bg-cream ring-1 ring-ink/10 transition-colors hover:ring-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
            aria-label="use random names"
            title="random names"
          >
            <Dices className="h-[18px] w-[18px] text-ink/70" strokeWidth={2.25} />
          </motion.button>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className="group flex h-[46px] flex-1 items-center justify-center gap-2.5 rounded-full bg-ink text-sm font-semibold lowercase tracking-wide text-paper shadow-[0_18px_34px_-16px_rgba(25,21,16,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            {mode === "intro" ? "start on this device" : "start new match"}
            <motion.span
              className="inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </motion.button>
        </motion.div>

        {/* second option — private online room */}
        {mode === "intro" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, type: "spring", stiffness: 240, damping: 24 }}
          >
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-ink/10" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/30">or</span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <motion.button
              type="button"
              onClick={onPlayOnline}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl bg-cream px-4 py-3.5 text-left ring-1 ring-ink/10 transition-all duration-300 hover:bg-pine/[0.07] hover:ring-pine/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/60"
            >
              {/* sheen sweep on hover */}
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-all duration-700 group-hover:left-full" />

              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pine/12 text-pine transition-transform duration-300 group-hover:scale-110">
                <Users className="h-[18px] w-[18px]" strokeWidth={2.1} />
                <motion.span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-pine ring-2 ring-cream"
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>

              <span className="relative min-w-0 flex-1">
                <span className="block text-[14px] font-semibold lowercase leading-tight">
                  play with a friend
                </span>
                <span className="block text-[11px] leading-snug text-ink/45">
                  get a private link · play from anywhere
                </span>
              </span>

              <span className="relative text-ink/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-pine">
                →
              </span>
            </motion.button>
          </motion.div>
        )}

        {onBack && <BackRow onBack={onBack} delay={0.66} />}
      </motion.form>
    </motion.div>
  );
}
