import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Copy,
  Crown,
  Link2,
  Loader2,
  Share2,
  UserRound,
  Users,
  Wifi,
  X as XIcon,
} from "lucide-react";
import { ROOM_CODE_LENGTH, type useOnlineSession } from "../game/useOnline";
import { BackRow } from "./BackRow";
import { MATCH_OPTIONS } from "./MatchLengthDialog";
import type { Lang } from "../game/roasts";
import { cn } from "../utils/cn";

type Session = ReturnType<typeof useOnlineSession>;
type Step = "name" | "choice" | "length" | "lang" | "host" | "join";

interface OnlineDialogProps {
  session: Session;
  initialName: string;
  /** room code pulled out of an invite link */
  initialCode?: string;
  /** current roast language — reused as the default in the picker */
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onClose: () => void;
}

const MAX = 12;

/**
 * Invite links put the code in the URL *fragment* (`#room=…`).
 * Browsers never transmit fragments to servers, so the code stays
 * out of server logs, analytics and Referer headers.
 */
export function roomLink(code: string) {
  if (typeof window === "undefined") return "";
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#room=${code}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      return true;
    } catch {
      return false;
    }
  }
}

export function OnlineDialog({
  session,
  initialName,
  initialCode = "",
  lang,
  onLangChange,
  onClose,
}: OnlineDialogProps) {
  const invited = initialCode.length === ROOM_CODE_LENGTH;
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState(initialName);
  const [codeInput, setCodeInput] = useState(initialCode);
  /** match length picked on the previous step, used when the room opens */
  const pendingTarget = useRef(0);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [touched, setTouched] = useState(false);

  const cleanName = name.trim();
  const nameInvalid = touched && cleanName.length === 0;
  const canJoin = codeInput.trim().length === ROOM_CODE_LENGTH && session.status !== "connecting";
  const link = roomLink(session.code);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1900);
    return () => clearTimeout(t);
  }, [copied]);

  const goName = (e?: FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!cleanName) return;
    // arriving from an invite link skips straight to joining
    if (invited) {
      session.join(cleanName, initialCode);
      setStep("join");
    } else {
      setStep("choice");
    }
  };

  /** match length chosen → now pick the roast language */
  const chooseLength = (chosen: number) => {
    pendingTarget.current = chosen;
    setStep("lang");
  };

  /** picking the language is what actually opens the room */
  const startHost = (lang: Lang) => {
    session.host(cleanName, pendingTarget.current, lang);
    setStep("host");
  };

  const startJoin = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canJoin) return;
    session.join(cleanName, codeInput);
  };

  const back = () => {
    if (step === "host" || step === "join") {
      session.leave();
      if (invited) {
        setStep("name");
      } else {
        setCodeInput("");
        setStep(step === "host" ? "lang" : "choice");
      }
    } else if (step === "lang") {
      setStep("length");
    } else if (step === "length") {
      setStep("choice");
    } else if (step === "choice") {
      setStep("name");
    }
  };

  const share = async () => {
    const shareData = {
      title: "tic tac toe",
      text: `${cleanName || "a challenger"} invited you to a tic tac toe duel!`,
      url: link,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* dismissed — fall through to copy */
      }
    }
    if (await copyText(link)) setCopied("link");
  };

  const panel = {
    initial: { opacity: 0, x: 24, filter: "blur(4px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -24, filter: "blur(4px)" },
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto px-5 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="absolute inset-0 bg-ink/25 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      />

      <motion.div
        initial={{ scale: 0.86, y: 34, opacity: 0, rotateX: 8 }}
        animate={{ scale: 1, y: 0, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.94, y: 14, opacity: 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 24 }}
        style={{ transformPerspective: 900 }}
        className="relative w-full max-w-[420px] rounded-[1.75rem] bg-paper p-7 shadow-[0_40px_90px_-30px_rgba(25,21,16,0.5)] ring-1 ring-ink/10 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50"
        >
          <XIcon className="h-4 w-4" />
        </button>

        <div className="mb-6 space-y-1.5 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.15 }}
            className="relative mx-auto mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-ink text-paper shadow-[0_14px_26px_-12px_rgba(25,21,16,0.7)]"
          >
            <Users className="h-5 w-5" strokeWidth={2.15} />
            <motion.span
              className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-pine ring-2 ring-paper"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <h2 className="font-serif text-[28px] leading-none tracking-tight">
            {invited ? "you're invited" : "play with a friend"}
          </h2>
          <p className="text-[13px] text-ink/50">
            {invited ? "just pick a name to enter the room." : "private room · real time · any device."}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {/* STEP: name */}
          {step === "name" && (
            <motion.form key="name" {...panel} onSubmit={goName}>
              <div className="space-y-1.5">
                <label
                  htmlFor="online-name"
                  className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/45"
                >
                  <UserRound className="h-3 w-3 text-ink/60" strokeWidth={2.5} />
                  your name
                </label>
                <input
                  id="online-name"
                  type="text"
                  value={name}
                  maxLength={MAX}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  placeholder="your duel name"
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "w-full rounded-xl bg-cream px-4 py-3 text-[15px] font-medium text-ink shadow-[inset_0_1px_2px_rgba(25,21,16,0.06)] outline-none transition-all duration-200 placeholder:text-ink/25 focus:scale-[1.02]",
                    nameInvalid ? "ring-2 ring-coral/70" : "ring-1 ring-ink/10 focus:ring-2 focus:ring-ink/40"
                  )}
                />
              </div>

              {invited && (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-pine/8 px-4 py-2.5 ring-1 ring-pine/20">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-pine" strokeWidth={2.25} />
                  <span className="text-[11px] font-medium lowercase tracking-wide text-pine">
                    room <span className="font-bold tracking-[0.18em]">{initialCode}</span>
                  </span>
                </div>
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="group mt-5 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-full bg-ink text-sm font-semibold lowercase tracking-wide text-paper shadow-[0_18px_34px_-16px_rgba(25,21,16,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                {invited ? "enter the room" : "continue"}
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </motion.button>

              <BackRow onBack={onClose} delay={0.34} />
            </motion.form>
          )}

          {/* STEP: create or join */}
          {step === "choice" && (
            <motion.div key="choice" {...panel}>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => setStep("length")}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl bg-cream px-4 py-6 ring-1 ring-ink/10 transition-all duration-300 hover:bg-coral/[0.08] hover:ring-coral/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/60"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-coral/12 text-coral transition-transform duration-300 group-hover:-rotate-12">
                    <Crown className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold lowercase">create a room</span>
                  <span className="text-[10px] lowercase tracking-wide text-ink/40">you play as x</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setStep("join")}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex flex-col items-center gap-2.5 rounded-2xl bg-cream px-4 py-6 ring-1 ring-ink/10 transition-all duration-300 hover:bg-pine/[0.08] hover:ring-pine/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/60"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-pine/12 text-pine transition-transform duration-300 group-hover:rotate-12">
                    <Link2 className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold lowercase">join a room</span>
                  <span className="text-[10px] lowercase tracking-wide text-ink/40">you play as o</span>
                </motion.button>
              </div>
              {session.error && (
                <p className="mt-4 text-center text-[11.5px] font-medium lowercase text-coral">
                  {session.error}
                </p>
              )}
              <BackRow onBack={back} />
            </motion.div>
          )}

          {/* STEP: match length — chosen before the room opens */}
          {step === "length" && (
            <motion.div key="length" {...panel}>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/45">
                match length
              </p>
              <p className="mt-2 text-center font-serif text-[14px] italic leading-snug text-ink/55">
                how many rounds to crown a champion?
              </p>

              <div className="mt-4 space-y-2.5">
                {MATCH_OPTIONS.map((opt, i) => (
                  <motion.button
                    key={opt.target}
                    type="button"
                    onClick={() => chooseLength(opt.target)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + i * 0.06 }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-left ring-1 ring-ink/10 transition-colors hover:bg-coral/[0.07] hover:ring-coral/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/50"
                  >
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold leading-tight lowercase">
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink/45">{opt.sub}</span>
                    </span>
                    <span className="shrink-0 text-ink/25 transition-all duration-300 group-hover:translate-x-1 group-hover:text-coral">
                      →
                    </span>
                  </motion.button>
                ))}
              </div>
              <BackRow onBack={back} />
            </motion.div>
          )}

          {/* STEP: language — the roasts, picked before the room opens */}
          {step === "lang" && (
            <motion.div key="lang" {...panel} className="flex flex-col items-center">
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/45">
                select the language
              </p>
              <p className="mt-2 text-center font-serif text-[14px] italic leading-snug text-ink/55">
                we've got something.......
              </p>

              <div className="mt-5 w-full space-y-2.5">
                {(["en", "ml"] as Lang[]).map((id, i) => (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => {
                      onLangChange(id);
                      startHost(id);
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex w-full items-center justify-center rounded-2xl bg-cream py-4 text-[15px] font-semibold ring-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/50",
                      lang === id
                        ? "ring-ink/40"
                        : "ring-ink/10 hover:bg-ink/[0.06] hover:ring-ink/25"
                    )}
                  >
                    <span className={cn(id === "ml" && "font-mal")}>
                      {id === "en" ? "English" : "മലയാളം"}
                    </span>
                  </motion.button>
                ))}
              </div>
              <BackRow onBack={back} />
            </motion.div>
          )}

          {/* STEP: host — the private invite link */}
          {step === "host" && (
            <motion.div key="host" {...panel} className="flex flex-col items-center">
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-ink/45">
                your private room link
              </span>

              {/* the link box */}
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.12 }}
                className="mt-3 flex w-full items-center gap-2 rounded-xl bg-cream p-1.5 pl-3.5 ring-1 ring-ink/10"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0 text-ink/35" strokeWidth={2.25} />
                <span className="min-w-0 flex-1 truncate text-left font-mono text-[11.5px] text-ink/65">
                  {link}
                </span>
                <motion.button
                  type="button"
                  onClick={async () => {
                    if (await copyText(link)) setCopied("link");
                  }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="copy link"
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors focus:outline-none",
                    copied === "link" ? "bg-pine text-cream" : "bg-ink text-paper hover:bg-ink/85"
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied === "link" ? "yes" : "no"}
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.4, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {copied === "link" ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={2.25} />
                      )}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              <AnimatePresence>
                {copied === "link" && (
                  <motion.span
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-[11px] font-semibold lowercase tracking-wide text-pine"
                  >
                    link copied — now send it over!
                  </motion.span>
                )}
              </AnimatePresence>

              <motion.button
                type="button"
                onClick={share}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full bg-pine py-3 text-[13px] font-semibold lowercase tracking-wide text-cream shadow-[0_16px_30px_-14px_rgba(23,112,92,0.7)] transition-colors hover:bg-ink focus:outline-none"
              >
                <Share2 className="h-4 w-4" strokeWidth={2.25} />
                share invite
              </motion.button>

              {/* code fallback */}
              <div className="my-4 flex w-full items-center gap-3">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.28em] text-ink/30">
                  or share the code
                </span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (await copyText(session.code)) setCopied("code");
                }}
                className="group flex w-full justify-center gap-1 focus:outline-none sm:gap-1.5"
                aria-label="copy room code"
              >
                {session.code.split("").map((ch, i) => (
                  <motion.span
                    key={`${session.code}-${i}`}
                    initial={{ y: 16, opacity: 0, rotateX: -60 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24, delay: 0.2 + i * 0.05 }}
                    className={cn(
                      "grid h-10 flex-1 max-w-[38px] place-items-center rounded-lg text-sm font-bold shadow-[0_10px_20px_-10px_rgba(25,21,16,0.55)] transition-colors tabular-nums sm:h-11 sm:text-base",
                      copied === "code" ? "bg-pine text-cream" : "bg-ink text-paper group-hover:bg-ink/85"
                    )}
                  >
                    {ch}
                  </motion.span>
                ))}
              </button>
              <span className="mt-2 text-[10px] lowercase tracking-[0.2em] text-ink/35">
                {copied === "code" ? "code copied!" : "tap the code to copy"}
              </span>

              {/* waiting indicator */}
              <div className="mt-6 flex items-center gap-2.5 rounded-full bg-pine/10 px-4 py-2 ring-1 ring-pine/20">
                <motion.span
                  className="h-2 w-2 rounded-full bg-pine"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                />
                <span
                  className={cn(
                    "text-[12px] font-medium lowercase",
                    session.signalOk ? "text-pine" : "text-coral"
                  )}
                >
                  {session.signalOk ? "waiting for your friend…" : "reconnecting the room…"}
                </span>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-pine/60" strokeWidth={2.5} />
              </div>
              <p className="mt-3 max-w-[270px] text-center text-[11px] leading-relaxed text-ink/40">
                the match begins the moment they open your link. keep this tab open!
              </p>
              {session.error && (
                <p className="mt-3 max-w-[260px] text-center text-[11.5px] font-medium lowercase text-coral">
                  {session.error}
                </p>
              )}
              <BackRow onBack={back} />
            </motion.div>
          )}

          {/* STEP: join */}
          {step === "join" && (
            <motion.form key="join" {...panel} onSubmit={startJoin} className="flex flex-col items-center">
              {invited ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <motion.span
                    className="grid h-12 w-12 place-items-center rounded-full bg-pine/12 text-pine"
                    animate={session.status === "connecting" ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Wifi className="h-5 w-5" strokeWidth={2.25} />
                  </motion.span>

                  {session.status === "connecting" && (
                    <span className="flex items-center gap-2 text-[13px] font-medium lowercase text-ink/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                      entering room {initialCode}…
                    </span>
                  )}

                  {session.error && (
                    <>
                      <p className="max-w-[240px] text-center text-[12px] font-medium lowercase leading-relaxed text-coral">
                        {session.error}
                      </p>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          session.join(cleanName, initialCode);
                        }}
                        className="mt-1 flex items-center gap-2 rounded-full bg-pine px-6 py-2.5 text-sm font-semibold lowercase tracking-wide text-paper shadow-[0_12px_24px_-12px_rgba(25,21,16,0.45)] focus:outline-none"
                      >
                        <Loader2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                        try again
                      </motion.button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <label
                    htmlFor="room-code"
                    className="text-[10px] font-semibold uppercase tracking-[0.32em] text-ink/45"
                  >
                    enter the room code
                  </label>
                  <input
                    id="room-code"
                    type="text"
                    value={codeInput}
                    maxLength={ROOM_CODE_LENGTH}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    autoFocus
                    placeholder={"•".repeat(ROOM_CODE_LENGTH)}
                    onChange={(e) =>
                      setCodeInput(
                        e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, ROOM_CODE_LENGTH)
                      )
                    }
                    className="mt-3 w-full max-w-[220px] rounded-xl bg-cream px-3 py-3.5 text-center font-mono text-3xl font-bold uppercase tracking-[0.3em] text-ink shadow-[inset_0_1px_2px_rgba(25,21,16,0.06)] outline-none ring-1 ring-ink/10 transition-all placeholder:tracking-[0.3em] placeholder:text-ink/20 focus:ring-2 focus:ring-pine/50"
                  />
                  <motion.button
                    type="submit"
                    disabled={!canJoin}
                    whileHover={canJoin ? { scale: 1.03 } : undefined}
                    whileTap={canJoin ? { scale: 0.95 } : undefined}
                    className={cn(
                      "mt-5 flex h-[46px] w-full items-center justify-center gap-2.5 rounded-full text-sm font-semibold lowercase tracking-wide shadow-[0_18px_34px_-16px_rgba(25,21,16,0.5)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/60 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                      canJoin ? "bg-pine text-paper" : "cursor-not-allowed bg-ink/10 text-ink/35 shadow-none"
                    )}
                  >
                    {session.status === "connecting" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        connecting…
                      </>
                    ) : (
                      "join the match"
                    )}
                  </motion.button>
                </>
              )}

              {session.error && (
                <p className="mt-3.5 max-w-[260px] text-center text-[11.5px] font-medium lowercase text-coral">
                  {session.error}
                </p>
              )}
              <BackRow onBack={back} />
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}


