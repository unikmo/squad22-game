import { Card, SQUAD22_CARDS, shuffleDeck, isLegalPositionPair, isLegalTraitTriple, getCardValue } from './cards';

/**
 * A position slot on a player's own side of the pitch. A slot is only ever
 * CREATED by one of the two official plays:
 *   - Position Pair: 2 cards, same position number -> the slot is born full
 *     (2 cards) and closed immediately.
 *   - Trait Triple: 3 cards, same trait, 3 different positions -> 3 slots
 *     are born at once, each with just 1 card ("half-open").
 * A half-open slot (cards.length === 1) can later be completed to 2 cards
 * by playing a single matching-position card of ANY trait. Crucially, that
 * completing card can come from ANY player's hand, on ANY player's turn —
 * not just the player who opened the slot. The points for the completing
 * card always go to whoever plays it, even though the card physically fills
 * a slot on the original opener's side of the pitch. That's what makes the
 * Trait Triple a real risk/reward play: it opens 3 positions cheaply, but
 * it also hands every other player a shot at finishing (and banking) one
 * of those slots with a single card, instead of a full pair.
 */
export interface PositionSlot {
  position: number | string;
  cards: Card[]; // length 1 = half-open, length 2 = complete/closed
  openedBy: number; // index of the player whose play created this slot
}

export interface GameState {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Username: string;
  player2Username: string;
  hands: Card[][];
  tables: PositionSlot[][];
  scores: number[];
  targetScore: number;
  drawPile: Card[];
  openPile: Card | null;
  discardPiles: Card[][];
  currentPlayer: number;
  round: number;
  phase: 'draw' | 'play' | 'discard' | 'finished';
  cardDrawn: boolean[];
  cardsPlayed: boolean[];
  winner: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function initializeGame(player1Id: string, player2Id: string, player1Username: string, player2Username: string, targetScore: number = 300): GameState {
  const deck = shuffleDeck();
  const hand1 = deck.splice(0, 7);
  const hand2 = deck.splice(0, 7);

  return {
    id: generateGameId(),
    player1Id,
    player2Id,
    player1Username,
    player2Username,
    hands: [hand1, hand2],
    tables: [[], []],
    scores: [0, 0],
    targetScore,
    drawPile: deck,
    openPile: null,
    discardPiles: [[], []],
    currentPlayer: 0,
    round: 1,
    phase: 'draw',
    cardDrawn: [false, false],
    cardsPlayed: [false, false],
    winner: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function drawCard(gameState: GameState, from: 'pile' | 'open'): GameState {
  if (gameState.phase !== 'draw') {
    throw new Error('Can only draw during draw phase');
  }

  if (gameState.cardDrawn[gameState.currentPlayer]) {
    throw new Error('Already drew this turn');
  }

  const updated = clone(gameState);

  if (from === 'pile') {
    if (updated.drawPile.length === 0) {
      throw new Error('Draw pile is empty');
    }
    const card = updated.drawPile.shift();
    updated.hands[updated.currentPlayer].push(card);
  } else if (from === 'open') {
    if (!updated.openPile) {
      throw new Error('No open pile card available');
    }
    updated.hands[updated.currentPlayer].push(updated.openPile);
    updated.openPile = null;
  }

  updated.cardDrawn[updated.currentPlayer] = true;
  updated.phase = 'play';
  updated.updatedAt = new Date();

  return updated;
}

/** Is this position already opened (has an existing slot, half-open or full) on this player's own table? */
function hasSlot(table: PositionSlot[], position: number | string): boolean {
  return table.some(s => s.position === position);
}

/** Find a half-open slot (exactly 1 card) matching this position, searching every player's table. */
function findHalfOpenSlot(gameState: GameState, position: number | string): { playerIdx: number; slot: PositionSlot } | null {
  for (let p = 0; p < gameState.tables.length; p++) {
    const slot = gameState.tables[p].find(s => s.position === position && s.cards.length === 1);
    if (slot) return { playerIdx: p, slot };
  }
  return null;
}

/** Play 2 cards sharing a position number. Opens a brand-new slot, already complete (2 cards). */
export function playPositionPair(gameState: GameState, cardIndices: [number, number]): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }

  const hand = gameState.hands[gameState.currentPlayer];
  const cards = cardIndices.map(idx => hand[idx]);
  if (cards.some(c => !c)) throw new Error('Invalid card index');
  if (!isLegalPositionPair(cards[0], cards[1])) {
    throw new Error('Invalid position pair');
  }
  if (hasSlot(gameState.tables[gameState.currentPlayer], cards[0].position)) {
    throw new Error(`Position ${cards[0].position} is already opened — play a single matching card to complete it instead`);
  }

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, cardIndices);
  updated.tables[updated.currentPlayer].push({
    position: cards[0].position,
    cards: [cards[0], cards[1]],
    openedBy: updated.currentPlayer,
  });
  updated.scores[updated.currentPlayer] += getCardValue(cards[0], true) + getCardValue(cards[1], true);
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

/** Play 3 same-trait cards across 3 different positions. Opens 3 new slots, each half-open (1 card). */
export function playTraitTriple(gameState: GameState, cardIndices: [number, number, number]): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }

  const hand = gameState.hands[gameState.currentPlayer];
  const cards = cardIndices.map(idx => hand[idx]);
  if (cards.some(c => !c)) throw new Error('Invalid card index');
  if (!isLegalTraitTriple(cards)) {
    throw new Error('Invalid trait triple');
  }
  const table = gameState.tables[gameState.currentPlayer];
  if (cards.some(c => hasSlot(table, c.position))) {
    throw new Error('One of these positions is already opened on your table');
  }

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, cardIndices);
  cards.forEach((card: Card) => {
    updated.tables[updated.currentPlayer].push({ position: card.position, cards: [card], openedBy: updated.currentPlayer });
    updated.scores[updated.currentPlayer] += getCardValue(card, true);
  });
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

/** Play a single Flex card. It scores nothing on the table (but costs -15 if left in hand at round end). */
export function playFlex(gameState: GameState, cardIndex: number): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }
  const card = gameState.hands[gameState.currentPlayer][cardIndex];
  if (!card) throw new Error('Invalid card index');
  if (card.type !== 'flex') throw new Error('Only Flex cards can be played alone');

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, [cardIndex]);
  updated.scores[updated.currentPlayer] += getCardValue(card, true);
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

/**
 * Complete an already half-open position with a single matching-position
 * card (any trait). This is legal for ANY player, targeting ANY player's
 * half-open slot — including an opponent's. The card fills the slot it
 * targets (wherever that is), but the points always go to whoever played it.
 * If `target` is omitted, the current player's own table is checked first,
 * then every other player's, in turn order.
 */
export function completeOpenPosition(
  gameState: GameState,
  cardIndex: number,
  target?: { playerIdx: number }
): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }
  const card = gameState.hands[gameState.currentPlayer][cardIndex];
  if (!card) throw new Error('Invalid card index');
  if (card.type === 'flex') throw new Error('Play Flex cards with playFlex()');

  let found: { playerIdx: number; slot: PositionSlot } | null = null;
  if (target) {
    const slot = gameState.tables[target.playerIdx]?.find(s => s.position === card.position && s.cards.length === 1);
    found = slot ? { playerIdx: target.playerIdx, slot } : null;
  } else {
    found = findHalfOpenSlot(gameState, card.position);
  }
  if (!found) throw new Error(`No open position ${card.position} to complete`);

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, [cardIndex]);
  const slot = updated.tables[found.playerIdx].find((s: PositionSlot) => s.position === card.position && s.cards.length === 1);
  slot.cards.push(card);
  updated.scores[updated.currentPlayer] += getCardValue(card, true);
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

/**
 * Convenience dispatcher kept for simple callers: routes to the right play
 * type based on how many cards are passed. `target` only matters for a
 * single-card completion aimed at a specific player's slot.
 */
export function playCards(gameState: GameState, cardIndices: number[], target?: { playerIdx: number }): GameState {
  if (cardIndices.length === 1) {
    const card = gameState.hands[gameState.currentPlayer][cardIndices[0]];
    if (card?.type === 'flex') return playFlex(gameState, cardIndices[0]);
    return completeOpenPosition(gameState, cardIndices[0], target);
  }
  if (cardIndices.length === 2) return playPositionPair(gameState, [cardIndices[0], cardIndices[1]]);
  if (cardIndices.length === 3) return playTraitTriple(gameState, [cardIndices[0], cardIndices[1], cardIndices[2]]);
  throw new Error('Play 1, 2, or 3 cards');
}

export function discardCard(gameState: GameState, cardIndex: number): GameState {
  if (gameState.phase !== 'play' && gameState.phase !== 'discard') {
    throw new Error('Can only discard during play/discard phase');
  }

  const updated = clone(gameState);
  const hand = updated.hands[updated.currentPlayer];
  const card = hand[cardIndex];

  // Remove from hand and add to discard
  updated.hands[updated.currentPlayer] = hand.filter((_: Card, idx: number) => idx !== cardIndex);
  updated.discardPiles[updated.currentPlayer].push(card);
  updated.openPile = card;

  // Apply hand penalties
  updated.hands[updated.currentPlayer].forEach((c: Card) => {
    updated.scores[updated.currentPlayer] += getCardValue(c, false);
  });

  // Switch turn
  updated.currentPlayer = updated.currentPlayer === 0 ? 1 : 0;
  updated.round++;
  updated.phase = 'draw';
  updated.cardDrawn = [false, false];
  updated.cardsPlayed = [false, false];

  // Check win condition
  if (updated.scores[0] >= updated.targetScore) {
    updated.phase = 'finished';
    updated.winner = updated.player1Id;
  } else if (updated.scores[1] >= updated.targetScore) {
    updated.phase = 'finished';
    updated.winner = updated.player2Id;
  }

  updated.updatedAt = new Date();

  return updated;
}

/** Pure validity check — mirrors playCards' rules without mutating state. */
export function canPlayCards(gameState: GameState, cardIndices: number[]): boolean {
  try {
    const hand = gameState.hands[gameState.currentPlayer];
    const cards = cardIndices.map(idx => hand[idx]);
    if (cards.some(c => !c)) return false;

    if (cards.length === 2) {
      if (!isLegalPositionPair(cards[0], cards[1])) return false;
      return !hasSlot(gameState.tables[gameState.currentPlayer], cards[0].position);
    }
    if (cards.length === 3) {
      if (!isLegalTraitTriple(cards)) return false;
      return !cards.some(c => hasSlot(gameState.tables[gameState.currentPlayer], c.position));
    }
    if (cards.length === 1) {
      if (cards[0].type === 'flex') return true;
      return !!findHalfOpenSlot(gameState, cards[0].position);
    }
    return false;
  } catch {
    return false;
  }
}

function clone(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState));
}

function removeFromHand(state: GameState, playerIdx: number, indices: number[]) {
  state.hands[playerIdx] = state.hands[playerIdx].filter((_: Card, idx: number) => !indices.includes(idx));
}

function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
