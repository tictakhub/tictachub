import { useEffect, useRef, useState } from "react";
import { getWinInfo, type Board } from "./logic";
import { judgeMove, pickQuip, TONE, type Tone, type Verdict } from "./quips";
import type { Lang } from "./roasts";

export interface Quip {
  id: number;
  text: string;
  emoji: string;
  verdict: Verdict;
  tone: Tone;
}

/** watches the board and fires a short reaction after every move */
export function useMoveQuip(board: Board, lang: Lang): Quip | null {
  const prev = useRef<Board>(board);
  const seq = useRef(0);
  const [quip, setQuip] = useState<Quip | null>(null);

  useEffect(() => {
    const before = prev.current;
    prev.current = board;

    // find exactly one newly filled cell (ignores resets / new rounds)
    let index = -1;
    let changed = 0;
    for (let i = 0; i < 9; i++) {
      if (!before[i] && board[i]) {
        index = i;
        changed++;
      } else if (before[i] && before[i] !== board[i]) {
        changed = 99;
      }
    }
    if (changed !== 1 || index < 0) return;

    // the winning move gets the celebration instead
    if (getWinInfo(board)) return;

    const mark = board[index];
    if (!mark) return;

    const verdict = judgeMove(before, board, index, mark);

    const { text, emoji } = pickQuip(verdict, lang);

    seq.current += 1;
    setQuip({ id: seq.current, text, emoji, verdict, tone: TONE[verdict] });
  }, [board, lang]);

  // auto-dismiss — big moments linger a beat longer
  useEffect(() => {
    if (!quip) return;
    const long = quip.verdict === "doubleFumble" || quip.verdict === "fork";
    const t = setTimeout(() => setQuip(null), long ? 2100 : 1600);
    return () => clearTimeout(t);
  }, [quip]);

  return quip;
}
