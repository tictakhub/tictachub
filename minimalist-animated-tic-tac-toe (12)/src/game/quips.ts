/* Short reactions for every move.
   Ultra Gen-Z meme energy — reads like live stream chat.
   Good moves taunt the opponent. Bad moves roast the blunder. */

import { WIN_LINES, type Board, type Player } from "./logic";
import type { Lang } from "./roasts";
import { bagFactory } from "./shuffleBag";

export type Verdict =
  | "doubleFumble"
  | "missedWin"
  | "noBlock"
  | "fork"
  | "clutchBlock"
  | "threat"
  | "center"
  | "meh";

export type Tone = "bad" | "good" | "meh";

export const TONE: Record<Verdict, Tone> = {
  doubleFumble: "bad",
  missedWin: "bad",
  noBlock: "bad",
  fork: "good",
  clutchBlock: "good",
  threat: "good",
  center: "good",
  meh: "meh",
};

/** a little icon that pops next to each reaction */
export const EMOJI: Record<Verdict, string[]> = {
  doubleFumble: ["💀", "😭", "🤡", "🫠", "📉", "🚨", "🤦‍♂️"],
  missedWin: ["🫣", "🤦", "👓", "😩", "👀", "😭", "🫥"],
  noBlock: ["🚪", "😴", "🚨", "😳", "⚠️", "🔥", "🙈"],
  fork: ["🔥", "😈", "💀", "🎯", "🧠", "🍳", "👑"],
  clutchBlock: ["🧱", "🛑", "🛂", "😤", "🚫", "💪", "🪑"],
  threat: ["👀", "⏳", "🔒", "⚡", "😰", "⌛", "🚨"],
  center: ["👑", "😎", "🎯", "🧠", "✨", "🏰", "📈"],
  meh: ["🤔", "🫥", "😐", "🍃", "🤖", "🥱", "🎲", "⁉️"],
};

const QUIPS: Record<Lang, Record<Verdict, string[]>> = {
  en: {
    doubleFumble: [
      "911 🚨",
      "bro is THROWING",
      "uninstall it",
      "GIGA L",
      "rip bozo",
      "actual bot",
      "he's cooked",
      "criminally bad",
      "my screen died",
      "that's a crime",
    ],
    missedWin: [
      "IT WAS THERE",
      "bro is blind fr",
      "eyes CLOSED??",
      "glasses when",
      "braille moment",
      "wrong button 💀",
      "one square bro",
      "HE HAD IT",
      "free win: nah",
      "tragic. comedic.",
    ],
    noBlock: [
      "HE'S RIGHT THERE",
      "look UP bro",
      "door's WIDE open",
      "welcome mat out",
      "sleeping 💤",
      "self destruct in 1",
      "open house 🏠",
      "sir, your house",
      "5 alarm fire",
      "alarm clock when",
    ],
    fork: [
      "GG go next",
      "checkmate",
      "he's HIM",
      "fold now",
      "no way out",
      "actually GOATED",
      "he's cooking 🍳",
      "skill gap",
      "pick your poison",
      "game over bro",
    ],
    clutchBlock: [
      "WALL 🧱",
      "DENIED",
      "not today satan",
      "visa rejected",
      "bouncer mode",
      "application DENIED",
      "sit DOWN",
      "nah fam",
      "perfect timing",
      "security 🚔",
    ],
    threat: [
      "check the board",
      "last chance bro",
      "tick TOCK",
      "sweating yet?",
      "panik time",
      "he's closing in",
      "oh no oh no",
      "one square left",
      "clock's ticking",
      "DANGER ZONE",
    ],
    center: [
      "prime real estate",
      "penthouse taken",
      "landlord move",
      "big brain 🧠",
      "he KNOWS",
      "textbook. respect.",
      "center of gravity",
      "main plot taken",
    ],
    meh: [
      "vibes only",
      "random.org",
      "chat is this real",
      "he picked THAT?",
      "no thoughts",
      "bold strategy",
      "an AI did this",
      "dice roll",
      "head empty",
      "explained??",
    ],
  },
  /* Manglish — Malayalam + English code-switching, the way people actually text */
  ml: {
    doubleFumble: [
      "bro ഇത് throw ആണ്",
      "full കാഴ്ച അളിയാ",
      "911 വിളിക്കടാ",
      "uninstall ചെയ്ത് പോ",
      "GIGA പണി 💀",
      "ജയം gift ചെയ്തു",
      "rip അളിയാ",
      "എന്തുവാടാ ഇത്",
      "criminal move ആണ്",
      "screen പൊട്ടി പോയി",
    ],
    missedWin: [
      "അവിടെ ഉണ്ടായിരുന്നല്ലോ!",
      "bro is blind fr",
      "കണ്ണ് close ആയിരുന്നോ",
      "free win reject ചെയ്തു",
      "ഒരു കള്ളി മാത്രം അളിയാ",
      "glasses വാങ്ങിക്കോ",
      "HE HAD IT 😭",
      "എന്താ കാണാത്തേ",
      "braille moment 💀",
    ],
    noBlock: [
      "bro അവൻ ജയിക്കും",
      "മുകളിലേക്ക് നോക്കടാ",
      "വാതിൽ wide open ആണ്",
      "ഉറക്കമാണോ അളിയാ 💤",
      "welcome mat ഇട്ടു",
      "sir, your വീട്",
      "പണി വരുന്നുണ്ട് ട്ടോ",
      "alarm അടിക്കുന്നു 🚨",
      "self destruct in 1",
    ],
    fork: [
      "GG go next 💀",
      "അവൻ cook ചെയ്യുവാ 🍳",
      "ഇനി രക്ഷയില്ല bro",
      "checkmate അളിയാ",
      "രണ്ടും കയ്യിൽ ആണ്",
      "അവൻ HIM ആണ് 🔥",
      "fold ചെയ്തോ വേഗം",
      "skill gap ആണ് ബ്രോ",
      "game over മോനെ",
    ],
    clutchBlock: [
      "നടക്കില്ല മോനെ 🧱",
      "DENIED അളിയാ",
      "visa reject ചെയ്തു",
      "ഇരുന്നോ അവിടെ",
      "bouncer mode ON",
      "nice try പക്ഷേ ഇല്ല",
      "അടച്ചു പൂട്ടി",
      "security വിളിച്ചു 🚔",
      "perfect timing bro",
    ],
    threat: [
      "lock in ചെയ്യടാ",
      "tick TOCK അളിയാ",
      "last chance ആണ് ട്ടോ",
      "വിയർക്കുന്നുണ്ടോ",
      "panik time 😰",
      "ഒരു കള്ളി ബാക്കി",
      "അവൻ അടുത്തെത്തി",
      "DANGER ZONE ആണ്",
      "clock ticking ബ്രോ",
    ],
    center: [
      "center പിടിച്ചു 👑",
      "prime real estate",
      "landlord move ആണ്",
      "big brain അളിയാ 🧠",
      "അവന് അറിയാം ട്ടോ",
      "textbook move ബ്രോ",
      "penthouse booked",
      "mass entry 🔥",
    ],
    meh: [
      "vibes മാത്രം ആണ്",
      "random.org ആണോ",
      "chat ഇത് സത്യാണോ",
      "അത് എന്തിനാ ഇട്ടേ",
      "head empty ബ്രോ",
      "bold strategy അളിയാ",
      "AI ആണോ ഇത്",
      "plan ഒന്നും ഇല്ല",
      "ചുമ്മാ ഒരു click",
      "explained??",
    ],
  },
};

/** cells that would immediately complete a line for `mark` */
function winningCells(board: Board, mark: Player): number[] {
  const cells: number[] = [];
  for (const line of WIN_LINES) {
    const vals = line.map((i) => board[i]);
    const mine = vals.filter((v) => v === mark).length;
    const empty = vals.filter((v) => !v).length;
    if (mine === 2 && empty === 1) {
      cells.push(line[vals.findIndex((v) => !v)]);
    }
  }
  return cells;
}

/**
 * Judge a move. `before` is the board prior to the move,
 * `after` is the resulting board.
 */
export function judgeMove(before: Board, after: Board, index: number, mark: Player): Verdict {
  const opponent: Player = mark === "X" ? "O" : "X";

  const myWins = winningCells(before, mark);
  const threats = winningCells(before, opponent);

  const skippedWin = myWins.length > 0 && !myWins.includes(index);
  const skippedBlock = threats.length > 0 && !threats.includes(index);

  if (skippedWin && skippedBlock) return "doubleFumble";
  if (skippedWin) return "missedWin";
  if (skippedBlock) return "noBlock";

  const newThreats = winningCells(after, mark).length;
  if (newThreats >= 2) return "fork";

  if (threats.length > 0 && threats.includes(index)) return "clutchBlock";
  if (newThreats === 1) return "threat";

  const filled = after.filter(Boolean).length;
  if (index === 4 && filled <= 2) return "center";

  return "meh";
}

const getBag = bagFactory<string>();

export function pickQuip(verdict: Verdict, lang: Lang): { text: string; emoji: string } {
  const pool = QUIPS[lang]?.[verdict] ?? QUIPS.en[verdict];
  return {
    text: getBag(`q-${lang}-${verdict}`, pool).draw(),
    emoji: getBag(`e-${verdict}`, EMOJI[verdict]).draw(),
  };
}
