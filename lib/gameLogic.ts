import { Card, shuffleDeck, isLegalPositionPair, isLegalTraitTriple, getCardValue } from './cards';

/**
 * LEGACY FULL-MATCH ENGINE.
 *
 * This module is retained for the existing /api/games contract while the
 * canonical online match engine is rebuilt from the verified final deck and
 * 2026-08 rules. The public tactical demo does not depend on this module.
 * Do not treat its older cross-table completion model as the current official
 * Trait Triple rule; the active rules source says Triple positions open
 * globally and each player uses that opening on their own squad.
 */
export interface PositionSlot {
  position: number | string;
  cards: Card[];
  openedBy: number;
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

export function initializeGame(
  player1Id: string,
  player2Id: string,
  player1Username: string,
  player2Username: string,
  targetScore: number = 300,
): GameState {
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
    if (!card) {
      throw new Error('Draw pile is empty');
    }
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

function hasSlot(table: PositionSlot[], position: number | string): boolean {
  return table.some((slot) => slot.position === position);
}

function findHalfOpenSlot(
  gameState: GameState,
  position: number | string,
): { playerIdx: number; slot: PositionSlot } | null {
  for (let playerIdx = 0; playerIdx < gameState.tables.length; playerIdx++) {
    const slot = gameState.tables[playerIdx].find(
      (candidate) => candidate.position === position && candidate.cards.length === 1,
    );
    if (slot) return { playerIdx, slot };
  }
  return null;
}

export function playPositionPair(
  gameState: GameState,
  cardIndices: [number, number],
): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }

  const hand = gameState.hands[gameState.currentPlayer];
  const cards = cardIndices.map((index) => hand[index]);
  if (cards.some((card) => !card)) throw new Error('Invalid card index');
  if (!isLegalPositionPair(cards[0], cards[1])) {
    throw new Error('Invalid position pair');
  }
  if (hasSlot(gameState.tables[gameState.currentPlayer], cards[0].position)) {
    throw new Error(`Position ${cards[0].position} is already opened`);
  }

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, cardIndices);
  updated.tables[updated.currentPlayer].push({
    position: cards[0].position,
    cards: [cards[0], cards[1]],
    openedBy: updated.currentPlayer,
  });
  updated.scores[updated.currentPlayer] +=
    getCardValue(cards[0], true) + getCardValue(cards[1], true);
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

export function playTraitTriple(
  gameState: GameState,
  cardIndices: [number, number, number],
): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }

  const hand = gameState.hands[gameState.currentPlayer];
  const cards = cardIndices.map((index) => hand[index]);
  if (cards.some((card) => !card)) throw new Error('Invalid card index');
  if (!isLegalTraitTriple(cards)) {
    throw new Error('Invalid trait triple');
  }
  const table = gameState.tables[gameState.currentPlayer];
  if (cards.some((card) => hasSlot(table, card.position))) {
    throw new Error('One of these positions is already opened on your table');
  }

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, cardIndices);
  cards.forEach((card: Card) => {
    updated.tables[updated.currentPlayer].push({
      position: card.position,
      cards: [card],
      openedBy: updated.currentPlayer,
    });
    updated.scores[updated.currentPlayer] += getCardValue(card, true);
  });
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

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
 * Legacy compatibility helper. The public demo and active rules do not use
 * cross-table completion; this remains only for older callers until the full
 * match engine is replaced.
 */
export function completeOpenPosition(
  gameState: GameState,
  cardIndex: number,
  target?: { playerIdx: number },
): GameState {
  if (gameState.phase !== 'play') {
    throw new Error('Can only play cards during play phase');
  }
  const card = gameState.hands[gameState.currentPlayer][cardIndex];
  if (!card) throw new Error('Invalid card index');
  if (card.type === 'flex') throw new Error('Play Flex cards with playFlex()');

  let found: { playerIdx: number; slot: PositionSlot } | null = null;
  if (target) {
    const slot = gameState.tables[target.playerIdx]?.find(
      (candidate) => candidate.position === card.position && candidate.cards.length === 1,
    );
    found = slot ? { playerIdx: target.playerIdx, slot } : null;
  } else {
    found = findHalfOpenSlot(gameState, card.position);
  }
  if (!found) throw new Error(`No open position ${card.position} to complete`);

  const updated = clone(gameState);
  removeFromHand(updated, updated.currentPlayer, [cardIndex]);
  const slot = updated.tables[found.playerIdx].find(
    (candidate: PositionSlot) => candidate.position === card.position && candidate.cards.length === 1,
  );
  if (!slot) {
    throw new Error(`Open position ${card.position} disappeared before completion`);
  }
  slot.cards.push(card);
  updated.scores[updated.currentPlayer] += getCardValue(card, true);
  updated.cardsPlayed[updated.currentPlayer] = true;
  updated.updatedAt = new Date();
  return updated;
}

export function playCards(
  gameState: GameState,
  cardIndices: number[],
  target?: { playerIdx: number },
): GameState {
  if (cardIndices.length === 1) {
    const card = gameState.hands[gameState.currentPlayer][cardIndices[0]];
    if (card?.type === 'flex') return playFlex(gameState, cardIndices[0]);
    return completeOpenPosition(gameState, cardIndices[0], target);
  }
  if (cardIndices.length === 2) {
    return playPositionPair(gameState, [cardIndices[0], cardIndices[1]]);
  }
  if (cardIndices.length === 3) {
    return playTraitTriple(gameState, [cardIndices[0], cardIndices[1], cardIndices[2]]);
  }
  throw new Error('Play 1, 2, or 3 cards');
}

export function discardCard(gameState: GameState, cardIndex: number): GameState {
  if (gameState.phase !== 'play' && gameState.phase !== 'discard') {
    throw new Error('Can only discard during play/discard phase');
  }

  const updated = clone(gameState);
  const hand = updated.hands[updated.currentPlayer];
  const card = hand[cardIndex];
  if (!card) throw new Error('Invalid card index');

  updated.hands[updated.currentPlayer] = hand.filter((_, index) => index !== cardIndex);
  updated.discardPiles[updated.currentPlayer].push(card);
  updated.openPile = card;

  updated.currentPlayer = updated.currentPlayer === 0 ? 1 : 0;
  updated.round += 1;
  updated.phase = 'draw';
  updated.cardDrawn = [false, false];
  updated.cardsPlayed = [false, false];

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

export function canPlayCards(gameState: GameState, cardIndices: number[]): boolean {
  try {
    const hand = gameState.hands[gameState.currentPlayer];
    const cards = cardIndices.map((index) => hand[index]);
    if (cards.some((card) => !card)) return false;

    if (cards.length === 2) {
      if (!isLegalPositionPair(cards[0], cards[1])) return false;
      return !hasSlot(gameState.tables[gameState.currentPlayer], cards[0].position);
    }
    if (cards.length === 3) {
      if (!isLegalTraitTriple(cards)) return false;
      return !cards.some((card) => hasSlot(gameState.tables[gameState.currentPlayer], card.position));
    }
    if (cards.length === 1) {
      if (cards[0].type === 'flex') return true;
      return Boolean(findHalfOpenSlot(gameState, cards[0].position));
    }
    return false;
  } catch {
    return false;
  }
}

function clone(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState)) as GameState;
}

function removeFromHand(state: GameState, playerIdx: number, indices: number[]) {
  state.hands[playerIdx] = state.hands[playerIdx].filter(
    (_, index) => !indices.includes(index),
  );
}

function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
