import { getSquad22Card } from './deck';
import {
  discardAndPass,
  drawFromOpenPile,
  drawFromPile,
  legalMoves,
  openPileTakeOptions,
  playMove,
  type LegalMove,
  type MatchState,
} from './engine';

function moveUtility(state: MatchState, move: LegalMove): number {
  const ai = state.players[1];
  let score = move.scoreValue;
  if (move.type === 'complete') score += 18;
  if (move.type === 'pair') score += 14;
  if (move.type === 'staff') score += 9 + ai.staff.length * 2;
  if (move.type === 'global-start') score += 10;
  if (move.type === 'triple') score += 10;
  if (move.type === 'flex') {
    const slot = ai.squad.find((candidate) => candidate.position === move.position);
    score += slot?.cards.length === 1 ? 14 : 4;
  }
  const occupied = new Set(ai.squad.map((slot) => slot.position));
  if (move.position && !occupied.has(move.position)) score += 4;
  return score;
}

function bestMove(state: MatchState): LegalMove | null {
  const moves = legalMoves(state, 1);
  if (!moves.length) return null;
  return [...moves].sort((a, b) => moveUtility(state, b) - moveUtility(state, a))[0];
}

function bestOpenTake(state: MatchState) {
  const options = openPileTakeOptions(state, 1);
  if (!options.length) return null;
  const ranked = options.map((option) => {
    const best = [...option.legalMoves].sort((a, b) => moveUtility(state, b) - moveUtility(state, a))[0];
    const pickupCost = Math.max(0, option.takeIds.length - 1) * 5;
    return { option, utility: moveUtility(state, best) - pickupCost };
  }).sort((a, b) => b.utility - a.utility);
  return ranked[0].utility >= 10 ? ranked[0].option : null;
}

function discardUtility(state: MatchState, id: number) {
  const card = getSquad22Card(id);
  let keep = 0;
  if (card.kind === 'flex') keep += 18;
  if (card.kind === 'staff' && state.players[1].staff.length < 3) keep += 12;
  if (card.kind === 'player' && card.position) {
    const samePosition = state.players[1].hand.filter((other) =>
      other !== id && getSquad22Card(other).kind === 'player' && getSquad22Card(other).position === card.position
    ).length;
    keep += samePosition * 10;
    if (state.globalOpenPositions.includes(card.position)) keep += 8;
    const sameTrait = state.players[1].hand.filter((other) =>
      other !== id && getSquad22Card(other).kind === 'player' && getSquad22Card(other).trait === card.trait
    ).length;
    keep += sameTrait * 4;
    keep += card.points / 2;
  }
  return keep;
}

/** Runs one complete AI turn synchronously. */
export function runAiTurn(input: MatchState): MatchState {
  if (input.currentPlayer !== 1 || input.phase === 'round-end' || input.phase === 'match-end') return input;
  let state = input;

  if (state.phase === 'draw') {
    const open = bestOpenTake(state);
    state = open ? drawFromOpenPile(state, open.index) : drawFromPile(state);
    if (state.phase !== 'play' || state.currentPlayer !== 1) return state;
  }

  let safety = 0;
  while (state.phase === 'play' && state.currentPlayer === 1 && safety < 10) {
    safety += 1;
    const move = bestMove(state);
    if (!move) break;
    state = playMove(state, move);
    if (state.phase !== 'play') return state;
    if (safety >= 2 && Math.random() < 0.28) break;
  }

  if (state.phase === 'play' && state.currentPlayer === 1) {
    const hand = state.players[1].hand;
    if (!hand.length) return state;
    const discard = [...hand].sort((a, b) => discardUtility(state, a) - discardUtility(state, b))[0];
    state = discardAndPass(state, discard);
  }
  return state;
}
