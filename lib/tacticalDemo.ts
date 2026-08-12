export type DemoMoveType = 'pair' | 'triple' | 'global-start';

export type VerifiedDemoCard = {
  id: number;
  position?: number;
  trait?: 'CONTROL';
  flex?: boolean;
};

/**
 * Only facts explicitly verified against the final card artwork are encoded
 * here. The legacy lib/cards.ts model is intentionally not used because it is
 * stale relative to the final printed deck.
 */
export const VERIFIED_DEMO_CARDS: Record<number, VerifiedDemoCard> = {
  1: { id: 1, position: 1 },
  2: { id: 2, position: 1, trait: 'CONTROL' },
  9: { id: 9, position: 3 },
  10: { id: 10, position: 3, trait: 'CONTROL' },
  12: { id: 12, position: 3 },
  34: { id: 34, position: 9, trait: 'CONTROL' },
  58: { id: 58, flex: true },
};

export type DemoMove = {
  type: DemoMoveType;
  cards: number[];
  position?: number;
  label: string;
  tone: 'safe' | 'aggressive' | 'opportunistic';
  headline: string;
  detail: string;
};

const sortIds = (ids: number[]) => [...ids].sort((a, b) => a - b);

/**
 * Mirrors the current founder-approved core rule:
 * - Pair: two cards with the same position opens + completes that position locally.
 * - Triple: three same-trait cards in different positions opens those positions globally.
 * - Once globally open, any player may START that position in their own squad
 *   with one matching-position card, then add a second later.
 */
export function classifyDemoMove(
  selectedIds: number[],
  globallyOpenPositions: number[] = [],
): DemoMove | null {
  const ids = sortIds(selectedIds);
  const cards = ids.map((id) => VERIFIED_DEMO_CARDS[id]);
  if (cards.some((card) => !card)) return null;

  if (cards.length === 1) {
    const card = cards[0];
    if (!card?.position || card.flex || !globallyOpenPositions.includes(card.position)) return null;
    return {
      type: 'global-start',
      cards: ids,
      position: card.position,
      label: `Start globally-open position ${card.position}`,
      tone: 'opportunistic',
      headline: 'The opening is global. You use it first.',
      detail: `Position ${card.position} was opened by a Trait Triple. You may now start that position in your own squad with this single matching-position card, then add its second card later.`,
    };
  }

  if (cards.length === 2) {
    const [a, b] = cards;
    if (!a?.position || !b?.position || a.flex || b.flex || a.position !== b.position) return null;
    return {
      type: 'pair',
      cards: ids,
      position: a.position,
      label: `Position Pair · ${a.position}`,
      tone: 'safe',
      headline: 'One move. One position complete.',
      detail: 'Two matching position numbers open and complete that position in your own squad immediately.',
    };
  }

  if (cards.length === 3) {
    const traits = cards.map((card) => card?.trait);
    const positions = cards.map((card) => card?.position);
    const sameKnownTrait = traits.every((trait) => trait && trait === traits[0]);
    const distinctKnownPositions = positions.every(Boolean) && new Set(positions).size === 3;
    const containsFlex = cards.some((card) => card?.flex);
    if (!sameKnownTrait || !distinctKnownPositions || containsFlex) return null;

    return {
      type: 'triple',
      cards: ids,
      label: 'Trait Triple · CONTROL',
      tone: 'aggressive',
      headline: 'Three positions open — for everyone.',
      detail: 'The triple starts three positions in your squad and opens those same positions globally. Every player can now start them with one matching-position card.',
    };
  }

  return null;
}

export const DEMO_OPENING_HAND = [1, 2, 10, 34, 58] as const;
export const DEMO_GLOBAL_HAND = [1, 9, 58] as const;
export const DEMO_DECISION_HAND = [1, 2, 9, 10, 34, 58] as const;
