/* Roast picker — uses a shuffle bag so every line in the pool
   is shown once before any of them can repeat. */

import { EN_DRAW, EN_LOSER } from "./roastsEn";
import { ML_DRAW, ML_LOSER } from "./roastsMl";
import { bagFactory } from "./shuffleBag";

export type Lang = "en" | "ml";

const POOLS: Record<Lang, { loser: string[]; draw: string[] }> = {
  en: { loser: EN_LOSER, draw: EN_DRAW },
  ml: { loser: ML_LOSER, draw: ML_DRAW },
};

const getBag = bagFactory<string>();

const fill = (line: string, name: string) => line.replace(/\{name\}/g, name);

/** pick a roast in the chosen language — cycles the whole deck before repeating */
export function pickRoast(name: string, isDraw: boolean, lang: Lang = "en"): string {
  const pool = POOLS[lang] ?? POOLS.en;
  const list = isDraw ? pool.draw : pool.loser;
  const bag = getBag(`${lang}-${isDraw ? "draw" : "loser"}`, list);
  return fill(bag.draw(), name);
}

export const ROAST_LABEL: Record<Lang, { round: string; draw: string }> = {
  en: { round: "roast of the round 🔥", draw: "double roast 🔥" },
  ml: { round: "ഈ റൗണ്ടിലെ റോസ്റ്റ് 🔥", draw: "ഡബിൾ റോസ്റ്റ് 🔥" },
};
