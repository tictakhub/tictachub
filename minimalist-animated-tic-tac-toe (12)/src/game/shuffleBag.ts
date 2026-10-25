/* A shuffle bag ("deck") — draws every item once in random order
   before any item can repeat. Far better than random picking. */

export class ShuffleBag<T> {
  private items: T[];
  private deck: T[] = [];
  private lastDrawn: T | null = null;

  constructor(items: T[]) {
    this.items = items;
    this.refill();
  }

  private refill() {
    // Fisher-Yates shuffle of a fresh copy
    const next = [...this.items];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    // avoid the new deck starting with the card we just played
    if (next.length > 1 && next[0] === this.lastDrawn) {
      [next[0], next[next.length - 1]] = [next[next.length - 1], next[0]];
    }
    this.deck = next;
  }

  draw(): T {
    if (this.deck.length === 0) this.refill();
    const item = this.deck.pop() as T;
    this.lastDrawn = item;
    return item;
  }
}

/** lazily create + cache one bag per key */
export function bagFactory<T>() {
  const bags = new Map<string, ShuffleBag<T>>();
  return (key: string, items: T[]): ShuffleBag<T> => {
    let bag = bags.get(key);
    if (!bag) {
      bag = new ShuffleBag(items);
      bags.set(key, bag);
    }
    return bag;
  };
}
