import { useCallback, useState } from "react";
import { getWinInfo, type Board, type Player } from "./logic";
import { sfx } from "./sound";

export interface Scores {
  X: number;
  O: number;
  draws: number;
}

export type GameStatus = "playing" | "won" | "draw";

const fresh = (): Board => Array(9).fill(null);

export function useTicTacToe() {
  const [board, setBoard] = useState<Board>(fresh);
  const [turn, setTurn] = useState<Player>("X");
  const [starter, setStarter] = useState<Player>("X");
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 });
  const [round, setRound] = useState(1);

  const win = getWinInfo(board);
  const isDraw = !win && board.every(Boolean);
  const status: GameStatus = win ? "won" : isDraw ? "draw" : "playing";

  const place = useCallback(
    (index: number) => {
      if (status !== "playing" || board[index]) return;
      const next: Board = [...board];
      next[index] = turn;
      setBoard(next);

      const w = getWinInfo(next);
      if (w) {
        setScores((s) => ({ ...s, [w.winner]: s[w.winner] + 1 }));
        sfx.win();
      } else if (next.every(Boolean)) {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
        sfx.draw();
      } else {
        sfx.move(turn);
        setTurn(turn === "X" ? "O" : "X");
      }
    },
    [board, turn, status]
  );

  const newRound = useCallback(() => {
    const nextStarter = starter === "X" ? "O" : "X";
    setStarter(nextStarter);
    setTurn(nextStarter);
    setBoard(fresh());
    setRound((r) => r + 1);
    sfx.ui();
  }, [starter]);

  const resetAll = useCallback(() => {
    setScores({ X: 0, O: 0, draws: 0 });
    setStarter("X");
    setTurn("X");
    setBoard(fresh());
    setRound(1);
    sfx.ui();
  }, []);

  return { board, turn, status, win, scores, round, place, newRound, resetAll };
}
