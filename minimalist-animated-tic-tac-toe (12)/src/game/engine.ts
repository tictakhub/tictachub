import { getWinInfo, type Board, type Player } from "./logic";
import type { Lang } from "./roasts";

export interface Scores {
  X: number;
  O: number;
  draws: number;
}

export interface GameState {
  board: Board;
  turn: Player;
  starter: Player;
  scores: Scores;
  round: number;
  /** round wins needed to take the match — 0 = unlimited (host decides) */
  target: number;
  /** host-generated roast for the last completed round — synced so both screens match */
  roast: string;
  roastLang: Lang;
  /** roast for the series champion, set when the match is decided */
  champRoast: string;
}

export type Action =
  | { type: "move"; index: number }
  | { type: "newRound" }
  | { type: "reset" };

const freshBoard = (): Board => Array(9).fill(null);

export function initialState(target = 0): GameState {
  return {
    board: freshBoard(),
    turn: "X",
    starter: "X",
    scores: { X: 0, O: 0, draws: 0 },
    round: 1,
    target,
    roast: "",
    roastLang: "en",
    champRoast: "",
  };
}

export function reduce(state: GameState, action: Action): GameState {
  const win = getWinInfo(state.board);
  const over = !!win || state.board.every(Boolean);

  switch (action.type) {
    case "move": {
      if (over || state.board[action.index]) return state;
      const board = [...state.board];
      board[action.index] = state.turn;
      const w = getWinInfo(board);
      if (w) {
        return {
          ...state,
          board,
          scores: { ...state.scores, [w.winner]: state.scores[w.winner] + 1 },
        };
      }
      if (board.every(Boolean)) {
        return { ...state, board, scores: { ...state.scores, draws: state.scores.draws + 1 } };
      }
      return { ...state, board, turn: state.turn === "X" ? "O" : "X" };
    }
    case "newRound": {
      const starter = state.starter === "X" ? "O" : "X";
      return { ...state, board: freshBoard(), turn: starter, starter, round: state.round + 1 };
    }
    case "reset":
      return initialState();
  }
}
