import assert from 'node:assert/strict';
import { SQUAD22_DECK, getSquad22Card } from '../lib/squad22/deck';
import { runAiTurn } from '../lib/squad22/ai';
import {
  calculateRoundScore,
  createMatch,
  discardAndPass,
  drawFromOpenPile,
  drawFromPile,
  isFullSquad,
  legalMoves,
  openPileTakeOptions,
  playMove,
  startNextRound,
  tablePoints,
  type Formation,
  type MatchState,
} from '../lib/squad22/engine';

let checks = 0;
const check = (condition: unknown, message: string) => {
  checks += 1;
  assert.ok(condition, message);
};

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function stateFor(hand: number[], phase: MatchState['phase'] = 'play'): MatchState {
  const state = createMatch({ random: seeded(101) });
  state.currentPlayer = 0;
  state.phase = phase;
  state.players[0].hand = [...hand];
  state.players[0].squad = [];
  state.players[0].staff = [];
  state.players[1].hand = [6, 7, 8];
  state.players[1].squad = [];
  state.players[1].staff = [];
  state.drawPile = [40, 41, 42, 43, 44];
  state.openPile = [5];
  state.globalOpenPositions = [];
  state.requiredFirstPlayCardId = null;
  state.winner = null;
  state.roundReason = null;
  return state;
}

// Deck integrity.
check(SQUAD22_DECK.length === 58, 'deck must contain 58 cards');
check(new Set(SQUAD22_DECK.map((card) => card.id)).size === 58, 'card IDs must be unique');
check(SQUAD22_DECK.filter((card) => card.kind === 'player').length === 44, 'deck must contain 44 player cards');
check(SQUAD22_DECK.filter((card) => card.kind === 'staff').length === 12, 'deck must contain 12 staff cards');
check(SQUAD22_DECK.filter((card) => card.kind === 'flex').length === 2, 'deck must contain 2 Flex cards');

// Position Pair: verified cards 1 + 2.
{
  const state = stateFor([1, 2, 5]);
  const pair = legalMoves(state).find((move) => move.type === 'pair' && move.cardIds.includes(1) && move.cardIds.includes(2));
  check(Boolean(pair), '1 + 2 must be a legal Position Pair');
  const after = playMove(state, pair!);
  check(after.players[0].squad.some((slot) => slot.position === 1 && slot.cards.length === 2), 'Pair must complete position 1');
}

// Trait Triple: verified CONTROL cards 2 + 10 + 34, and global opening for the opponent.
{
  let state = stateFor([2, 10, 34, 5]);
  const triple = legalMoves(state).find((move) => move.type === 'triple' && [2, 10, 34].every((id) => move.cardIds.includes(id)));
  check(Boolean(triple), '2 + 10 + 34 must be a legal CONTROL Trait Triple');
  state = playMove(state, triple!);
  check([1, 3, 9].every((position) => state.globalOpenPositions.includes(position)), 'Trait Triple must globally open positions 1, 3 and 9');
  state.currentPlayer = 1;
  state.phase = 'play';
  state.players[1].hand = [9, 6]; // card 9 is position 3
  const globalStart = legalMoves(state, 1).find((move) => move.type === 'global-start' && move.position === 3 && move.cardIds.includes(9));
  check(Boolean(globalStart), 'opponent must be able to use a globally opened position');
}

// Open Pile: selected target must be immediately playable and must be used first.
{
  let state = stateFor([10, 34, 5], 'draw');
  state.openPile = [7, 2];
  state.drawPile = [40, 41];
  const option = openPileTakeOptions(state).find((candidate) => candidate.cardId === 2);
  check(Boolean(option), 'card 2 must be a valid Open Pile target when it completes the CONTROL triple');
  state = drawFromOpenPile(state, option!.index);
  check(state.requiredFirstPlayCardId === 2, 'Open Pile target must be committed as the first-play card');
  check(legalMoves(state).every((move) => move.cardIds.includes(2)), 'every first legal move after an Open Pile take must use the chosen target');
  assert.throws(() => discardAndPass(state, 5), /Play .* first/, 'cannot discard before playing the chosen Open Pile target');
  const triple = legalMoves(state).find((move) => move.type === 'triple');
  state = playMove(state, triple!);
  check(!state.requiredFirstPlayCardId, 'Open Pile commitment must clear after the target is played');
}

// Draw-pile rule: if nothing is playable, the drawn card is automatically discarded and turn passes.
{
  const state = stateFor([1], 'draw');
  state.drawPile = [5, 6];
  state.openPile = [7];
  const after = drawFromPile(state);
  check(after.currentPlayer === 1 && after.phase === 'draw', 'unplayable closed draw must pass the turn');
  check(after.openPile[after.openPile.length - 1] === 5, 'unplayable drawn card must become the Open Pile top card');
}

// Flex and Staff behavior.
{
  let state = stateFor([58, 5]);
  const flexMoves = legalMoves(state).filter((move) => move.type === 'flex');
  check(flexMoves.length === 11, 'Flex must be placeable in any of 11 empty positions');
  state = playMove(state, flexMoves.find((move) => move.position === 1)!);
  check(tablePoints(state.players[0]) === 0, 'Flex contributes 0 table points');

  state = stateFor([45, 5]);
  const staff = legalMoves(state).find((move) => move.type === 'staff');
  check(Boolean(staff), 'Staff card must be playable into the Staff rail');
  state = playMove(state, staff!);
  check(state.players[0].staff.length === 1, 'Staff play must occupy a Staff slot');
  check(tablePoints(state.players[0]) === 10, 'Staff card contributes +10 on table');
}

// Final-card discard must end the round immediately.
{
  const state = stateFor([5]);
  const after = discardAndPass(state, 5);
  check(after.phase === 'round-end' || after.phase === 'match-end', 'discarding the final hand card must end the round');
  check(after.players[0].hand.length === 0, 'final discard must leave an empty hand');
}

// Full Squad and +50 bonus.
{
  const state = stateFor([5]);
  state.players[0].squad = Array.from({ length: 11 }, (_, index) => ({
    position: index + 1,
    cards: [index * 4 + 1, index * 4 + 2],
    openedBy: 'pair' as const,
  }));
  state.players[0].staff = [45, 46, 47];
  check(isFullSquad(state.players[0]), '22 player cards + 3 Staff must be a Full Squad');
  check(calculateRoundScore(state.players[0]).fullSquadBonus === 50, 'Full Squad must award +50');
}

// Empty Draw Pile ends the round.
{
  const state = stateFor([1], 'draw');
  state.drawPile = [];
  const after = drawFromPile(state);
  check(after.phase === 'round-end' || after.phase === 'match-end', 'empty Draw Pile must end the round');
}

// Reaching target score ends the match.
{
  const state = stateFor([1, 2]);
  state.players[0].totalScore = 295;
  const pair = legalMoves(state).find((move) => move.type === 'pair')!;
  const after = playMove(state, pair);
  check(after.phase === 'match-end', 'crossing the target score must end the match');
  check(after.winner === 0, 'higher score at target must produce the correct winner');
}

function playHumanTurn(input: MatchState): MatchState {
  let state = input;
  if (state.currentPlayer !== 0 || state.phase === 'round-end' || state.phase === 'match-end') return state;

  if (state.phase === 'draw') {
    const open = openPileTakeOptions(state, 0).sort((a, b) => a.takeIds.length - b.takeIds.length)[0];
    state = open ? drawFromOpenPile(state, open.index) : drawFromPile(state);
    if (state.currentPlayer !== 0 || state.phase !== 'play') return state;
  }

  let safety = 0;
  while (state.phase === 'play' && state.currentPlayer === 0 && safety < 12) {
    safety += 1;
    const move = legalMoves(state, 0)[0];
    if (!move) break;
    state = playMove(state, move);
    if (state.phase !== 'play') return state;
    if (safety >= 3) break;
  }

  if (state.phase === 'play' && state.currentPlayer === 0 && state.players[0].hand.length) {
    state = discardAndPass(state, state.players[0].hand[0]);
  }
  return state;
}

// End-to-end engine QA: multiple complete matches, all formation choices, no deadlocks.
{
  const formations: Formation[] = ['4-4-2', '4-3-3', '3-5-2', '5-3-2'];
  const originalRandom = Math.random;
  try {
    for (let run = 0; run < 12; run += 1) {
      const rng = seeded(1000 + run);
      Math.random = rng;
      let state = createMatch({ formation: formations[run % formations.length], targetScore: 300, handSize: run % 2 ? 5 : 7, random: rng });
      let steps = 0;
      while (state.phase !== 'match-end' && steps < 5000) {
        steps += 1;
        if (state.phase === 'round-end') {
          state = startNextRound(state, rng);
          continue;
        }
        state = state.currentPlayer === 0 ? playHumanTurn(state) : runAiTurn(state);
      }
      check(state.phase === 'match-end', `simulated match ${run + 1} must finish without deadlock`);
      check(state.winner === 0 || state.winner === 1, `simulated match ${run + 1} must have a winner`);
      check(state.round >= 1, `simulated match ${run + 1} must complete at least one round`);
    }
  } finally {
    Math.random = originalRandom;
  }
}

console.log(`Squad22 regression suite passed: ${checks} assertions`);
