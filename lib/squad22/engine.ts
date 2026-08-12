import { getSquad22Card, shuffleIds, type TraitColour } from './deck';

export type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '5-3-2';
export type HandSize = 5 | 7;
export type TargetScore = 300 | 500 | 600;
export type MatchPhase = 'draw' | 'play' | 'round-end' | 'match-end';
export type MoveType = 'pair' | 'triple' | 'global-start' | 'complete' | 'flex' | 'staff';

export interface PositionSlot {
  position: number;
  cards: number[];
  openedBy: 'pair' | 'triple' | 'global' | 'flex';
}

export interface PlayerState {
  id: 'human' | 'ai';
  name: string;
  hand: number[];
  squad: PositionSlot[];
  staff: number[];
  totalScore: number;
  roundScore: number;
}

export interface MatchEvent {
  id: number;
  actor: 'human' | 'ai' | 'system';
  text: string;
}

export interface MatchState {
  version: 1;
  matchId: string;
  targetScore: TargetScore;
  handSize: HandSize;
  formation: Formation;
  players: [PlayerState, PlayerState];
  currentPlayer: 0 | 1;
  round: number;
  phase: MatchPhase;
  drawPile: number[];
  openPile: number[];
  globalOpenPositions: number[];
  drawnThisTurn: boolean;
  selectedOpenIndex: number | null;
  /** When taking from the Open Pile, this chosen card must be used in the first play. */
  requiredFirstPlayCardId?: number | null;
  winner: 0 | 1 | null;
  roundReason: string | null;
  events: MatchEvent[];
  nextEventId: number;
  updatedAt: string;
}

export interface LegalMove {
  type: MoveType;
  cardIds: number[];
  position?: number;
  trait?: TraitColour;
  scoreValue: number;
  label: string;
}

export interface RoundScoreLine {
  table: number;
  handPenalty: number;
  fullSquadBonus: number;
  net: number;
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

function event(state: MatchState, actor: MatchEvent['actor'], text: string) {
  state.events.push({ id: state.nextEventId++, actor, text });
  state.events = state.events.slice(-18);
}

function slotFor(player: PlayerState, position: number) {
  return player.squad.find((slot) => slot.position === position);
}

function removeCards(hand: number[], cardIds: readonly number[]) {
  const remaining = [...hand];
  for (const id of cardIds) {
    const index = remaining.indexOf(id);
    if (index < 0) throw new Error(`Card ${id} is not in hand`);
    remaining.splice(index, 1);
  }
  return remaining;
}

function uniqueCombinations<T>(items: readonly T[], size: number): T[][] {
  const result: T[][] = [];
  const walk = (start: number, picked: T[]) => {
    if (picked.length === size) {
      result.push([...picked]);
      return;
    }
    for (let i = start; i <= items.length - (size - picked.length); i += 1) {
      picked.push(items[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return result;
}

function moveKey(move: LegalMove) {
  return `${move.type}:${[...move.cardIds].sort((a, b) => a - b).join(',')}:${move.position ?? ''}`;
}

export function isFullSquad(player: PlayerState) {
  const playerCards = player.squad.reduce((sum, slot) => sum + slot.cards.length, 0);
  return playerCards >= 22 && player.staff.length >= 3;
}

export function tablePoints(player: PlayerState) {
  const playerPoints = player.squad.flatMap((slot) => slot.cards)
    .reduce((sum, id) => sum + getSquad22Card(id).points, 0);
  const staffPoints = player.staff.reduce((sum, id) => sum + getSquad22Card(id).points, 0);
  return playerPoints + staffPoints;
}

export function handPenalty(player: PlayerState) {
  return player.hand.reduce((sum, id) => {
    const card = getSquad22Card(id);
    if (card.kind === 'flex') return sum - 15;
    return sum - card.points;
  }, 0);
}

export function calculateRoundScore(player: PlayerState): RoundScoreLine {
  const table = tablePoints(player);
  const penalty = handPenalty(player);
  const fullSquadBonus = isFullSquad(player) ? 50 : 0;
  return { table, handPenalty: penalty, fullSquadBonus, net: table + penalty + fullSquadBonus };
}

export function createMatch(options?: {
  playerName?: string;
  formation?: Formation;
  handSize?: HandSize;
  targetScore?: TargetScore;
  random?: () => number;
}): MatchState {
  const handSize = options?.handSize ?? 7;
  const deck = shuffleIds(options?.random);
  const humanHand = deck.splice(0, handSize);
  const aiHand = deck.splice(0, handSize);
  const firstOpen = deck.shift();
  if (!firstOpen) throw new Error('Deck cannot start empty');

  const state: MatchState = {
    version: 1,
    matchId: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    targetScore: options?.targetScore ?? 300,
    handSize,
    formation: options?.formation ?? '4-4-2',
    players: [
      { id: 'human', name: options?.playerName?.trim() || 'You', hand: humanHand, squad: [], staff: [], totalScore: 0, roundScore: 0 },
      { id: 'ai', name: 'The Gaffer', hand: aiHand, squad: [], staff: [], totalScore: 0, roundScore: 0 },
    ],
    currentPlayer: 0,
    round: 1,
    phase: 'draw',
    drawPile: deck,
    openPile: [firstOpen],
    globalOpenPositions: [],
    drawnThisTurn: false,
    selectedOpenIndex: null,
    requiredFirstPlayCardId: null,
    winner: null,
    roundReason: null,
    events: [],
    nextEventId: 1,
    updatedAt: now(),
  };
  event(state, 'system', `Round 1 begins. ${getSquad22Card(firstOpen).name} starts the Open Pile.`);
  return state;
}

export function legalMoves(state: MatchState, playerIndex = state.currentPlayer): LegalMove[] {
  const player = state.players[playerIndex];
  const hand = player.hand;
  const moves: LegalMove[] = [];
  const globalOpen = new Set(state.globalOpenPositions);

  if (player.staff.length < 3) {
    for (const id of hand) {
      const card = getSquad22Card(id);
      if (card.kind === 'staff') {
        moves.push({ type: 'staff', cardIds: [id], scoreValue: card.points, label: `Add ${card.name} to staff` });
      }
    }
  }

  for (const id of hand) {
    const card = getSquad22Card(id);
    if (card.kind !== 'flex') continue;
    for (let position = 1; position <= 11; position += 1) {
      const slot = slotFor(player, position);
      if (!slot || slot.cards.length < 2) {
        moves.push({ type: 'flex', cardIds: [id], position, scoreValue: 0, label: `Flex into position ${position}` });
      }
    }
  }

  const playerCardIds = hand.filter((id) => getSquad22Card(id).kind === 'player');

  for (const id of playerCardIds) {
    const card = getSquad22Card(id);
    if (!card.position) continue;
    const slot = slotFor(player, card.position);
    if (slot?.cards.length === 1) {
      moves.push({ type: 'complete', cardIds: [id], position: card.position, scoreValue: card.points, label: `Complete position ${card.position}` });
    } else if (!slot && globalOpen.has(card.position)) {
      moves.push({ type: 'global-start', cardIds: [id], position: card.position, scoreValue: card.points, label: `Use global opening at ${card.position}` });
    }
  }

  for (const [a, b] of uniqueCombinations(playerCardIds, 2)) {
    const cardA = getSquad22Card(a);
    const cardB = getSquad22Card(b);
    if (!cardA.position || cardA.position !== cardB.position) continue;
    if (slotFor(player, cardA.position)) continue;
    moves.push({
      type: 'pair', cardIds: [a, b], position: cardA.position,
      scoreValue: cardA.points + cardB.points,
      label: `Position Pair · ${cardA.position}`,
    });
  }

  for (const ids of uniqueCombinations(playerCardIds, 3)) {
    const cards = ids.map(getSquad22Card);
    const trait = cards[0].trait;
    if (!trait || cards.some((card) => card.trait !== trait)) continue;
    const positions = cards.map((card) => card.position as number);
    if (new Set(positions).size !== 3) continue;
    if (positions.some((position) => slotFor(player, position))) continue;
    moves.push({
      type: 'triple', cardIds: ids, trait,
      scoreValue: cards.reduce((sum, card) => sum + card.points, 0),
      label: `Trait Triple · ${trait.toUpperCase()}`,
    });
  }

  const seen = new Set<string>();
  const deduplicated = moves.filter((move) => {
    const key = moveKey(move);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const required = playerIndex === state.currentPlayer ? state.requiredFirstPlayCardId : null;
  if (!required) return deduplicated;
  return deduplicated.filter((move) => move.cardIds.includes(required));
}

export function openPileTakeOptions(state: MatchState, playerIndex = state.currentPlayer) {
  if (state.phase !== 'draw') return [];
  const options: Array<{ index: number; cardId: number; takeIds: number[]; legalMoves: LegalMove[] }> = [];
  for (let index = 0; index < state.openPile.length; index += 1) {
    const cardId = state.openPile[index];
    const takeIds = state.openPile.slice(index);
    const simulated = clone(state);
    simulated.requiredFirstPlayCardId = null;
    simulated.players[playerIndex].hand.push(...takeIds);
    const moves = legalMoves(simulated, playerIndex).filter((move) => move.cardIds.includes(cardId));
    if (moves.length) options.push({ index, cardId, takeIds, legalMoves: moves });
  }
  return options;
}

function maybeEndRoundAfterPlay(state: MatchState): MatchState {
  if (state.players[state.currentPlayer].hand.length === 0) {
    return endRound(state, `${state.players[state.currentPlayer].name} emptied their hand.`);
  }
  if (isFullSquad(state.players[state.currentPlayer])) {
    return endRound(state, `${state.players[state.currentPlayer].name} completed a Full Squad.`);
  }
  return state;
}

export function drawFromPile(input: MatchState): MatchState {
  if (input.phase !== 'draw') throw new Error('Draw is only legal at the start of a turn');
  if (!input.drawPile.length) return endRound(input, 'The Draw Pile ran out.');
  const state = clone(input);
  state.requiredFirstPlayCardId = null;
  const id = state.drawPile.shift();
  if (!id) return endRound(state, 'The Draw Pile ran out.');
  state.players[state.currentPlayer].hand.push(id);
  state.drawnThisTurn = true;
  event(state, state.currentPlayer === 0 ? 'human' : 'ai', 'Drew 1 card from the Draw Pile.');

  if (legalMoves(state, state.currentPlayer).length === 0) {
    state.players[state.currentPlayer].hand = removeCards(state.players[state.currentPlayer].hand, [id]);
    state.openPile.push(id);
    event(state, 'system', `No legal play. ${getSquad22Card(id).name} goes straight to the Open Pile.`);
    if (state.drawPile.length === 0) return endRound(state, 'The Draw Pile ran out.');
    return passTurn(state);
  }

  if (state.drawPile.length === 0) return endRound(state, 'The Draw Pile ran out.');
  state.phase = 'play';
  state.updatedAt = now();
  return state;
}

export function drawFromOpenPile(input: MatchState, openIndex: number): MatchState {
  if (input.phase !== 'draw') throw new Error('Open Pile can only be taken during draw phase');
  const option = openPileTakeOptions(input).find((candidate) => candidate.index === openIndex);
  if (!option) throw new Error('That Open Pile card cannot be played immediately');

  const state = clone(input);
  const takeIds = state.openPile.slice(openIndex);
  state.openPile = state.openPile.slice(0, openIndex);
  state.players[state.currentPlayer].hand.push(...takeIds);
  state.drawnThisTurn = true;
  state.requiredFirstPlayCardId = option.cardId;
  state.phase = 'play';
  event(state, state.currentPlayer === 0 ? 'human' : 'ai', `Took ${takeIds.length} card${takeIds.length === 1 ? '' : 's'} from the Open Pile to reach ${getSquad22Card(option.cardId).name}. That card must be played first.`);
  state.updatedAt = now();
  return state;
}

export function playMove(input: MatchState, requested: Pick<LegalMove, 'type' | 'cardIds' | 'position'>): MatchState {
  if (input.phase !== 'play') throw new Error('Cards can only be played after drawing');
  const legal = legalMoves(input).find((move) =>
    move.type === requested.type
    && (move.position ?? null) === (requested.position ?? null)
    && move.cardIds.length === requested.cardIds.length
    && move.cardIds.every((id) => requested.cardIds.includes(id))
  );
  if (!legal) {
    if (input.requiredFirstPlayCardId) {
      throw new Error(`Your first play must use ${getSquad22Card(input.requiredFirstPlayCardId).name}, the card you chose from the Open Pile.`);
    }
    throw new Error('That combination is not a legal Squad22 move');
  }

  const state = clone(input);
  const player = state.players[state.currentPlayer];
  player.hand = removeCards(player.hand, legal.cardIds);
  const cards = legal.cardIds.map(getSquad22Card);

  if (legal.type === 'staff') {
    player.staff.push(legal.cardIds[0]);
  } else if (legal.type === 'pair') {
    player.squad.push({ position: legal.position as number, cards: [...legal.cardIds], openedBy: 'pair' });
  } else if (legal.type === 'triple') {
    for (const card of cards) {
      if (!card.position) continue;
      player.squad.push({ position: card.position, cards: [card.id], openedBy: 'triple' });
      if (!state.globalOpenPositions.includes(card.position)) state.globalOpenPositions.push(card.position);
    }
    state.globalOpenPositions.sort((a, b) => a - b);
  } else if (legal.type === 'global-start') {
    player.squad.push({ position: legal.position as number, cards: [legal.cardIds[0]], openedBy: 'global' });
  } else if (legal.type === 'complete') {
    const slot = slotFor(player, legal.position as number);
    if (!slot) throw new Error('Position slot vanished');
    slot.cards.push(legal.cardIds[0]);
  } else if (legal.type === 'flex') {
    const position = legal.position as number;
    const slot = slotFor(player, position);
    if (slot) slot.cards.push(legal.cardIds[0]);
    else player.squad.push({ position, cards: [legal.cardIds[0]], openedBy: 'flex' });
  }

  if (state.requiredFirstPlayCardId && legal.cardIds.includes(state.requiredFirstPlayCardId)) {
    state.requiredFirstPlayCardId = null;
  }

  event(state, state.currentPlayer === 0 ? 'human' : 'ai', legal.type === 'triple'
    ? `${player.name} played a Trait Triple. Positions ${cards.map((card) => card.position).join(', ')} are now globally open.`
    : `${player.name}: ${legal.label}.`);
  state.updatedAt = now();
  return maybeEndRoundAfterPlay(state);
}

export function discardAndPass(input: MatchState, cardId: number): MatchState {
  if (input.phase !== 'play') throw new Error('Discard comes after the play phase');
  if (input.requiredFirstPlayCardId) {
    throw new Error(`Play ${getSquad22Card(input.requiredFirstPlayCardId).name} first — you took it from the Open Pile because it was immediately playable.`);
  }
  const state = clone(input);
  const player = state.players[state.currentPlayer];
  if (!player.hand.includes(cardId)) throw new Error('Discard card is not in hand');
  player.hand = removeCards(player.hand, [cardId]);
  state.openPile.push(cardId);
  event(state, state.currentPlayer === 0 ? 'human' : 'ai', `${player.name} discarded ${getSquad22Card(cardId).name}.`);
  if (player.hand.length === 0) {
    return endRound(state, `${player.name} emptied their hand.`);
  }
  return passTurn(state);
}

export function passTurn(input: MatchState): MatchState {
  const state = clone(input);
  state.currentPlayer = state.currentPlayer === 0 ? 1 : 0;
  state.phase = 'draw';
  state.drawnThisTurn = false;
  state.selectedOpenIndex = null;
  state.requiredFirstPlayCardId = null;
  state.updatedAt = now();
  return state;
}

export function endRound(input: MatchState, reason: string): MatchState {
  const state = clone(input);
  state.requiredFirstPlayCardId = null;
  const lines = state.players.map(calculateRoundScore) as [RoundScoreLine, RoundScoreLine];
  state.players.forEach((player, index) => {
    player.roundScore = lines[index].net;
    player.totalScore += lines[index].net;
  });
  state.roundReason = reason;
  event(state, 'system', `${reason} Round score: ${state.players[0].name} ${lines[0].net} · ${state.players[1].name} ${lines[1].net}.`);

  const humanAtTarget = state.players[0].totalScore >= state.targetScore;
  const aiAtTarget = state.players[1].totalScore >= state.targetScore;
  if (humanAtTarget || aiAtTarget) {
    state.phase = 'match-end';
    if (state.players[0].totalScore === state.players[1].totalScore) {
      state.phase = 'round-end';
      state.winner = null;
    } else {
      state.winner = state.players[0].totalScore > state.players[1].totalScore ? 0 : 1;
    }
  } else {
    state.phase = 'round-end';
  }
  state.updatedAt = now();
  return state;
}

export function startNextRound(input: MatchState, random: () => number = Math.random): MatchState {
  if (input.phase !== 'round-end') throw new Error('The current round is not finished');
  const deck = shuffleIds(random);
  const humanHand = deck.splice(0, input.handSize);
  const aiHand = deck.splice(0, input.handSize);
  const firstOpen = deck.shift();
  if (!firstOpen) throw new Error('Deck cannot start empty');
  const state = clone(input);
  state.round += 1;
  state.players[0].hand = humanHand;
  state.players[1].hand = aiHand;
  state.players[0].squad = [];
  state.players[1].squad = [];
  state.players[0].staff = [];
  state.players[1].staff = [];
  state.players[0].roundScore = 0;
  state.players[1].roundScore = 0;
  state.drawPile = deck;
  state.openPile = [firstOpen];
  state.globalOpenPositions = [];
  state.currentPlayer = state.round % 2 === 1 ? 0 : 1;
  state.phase = 'draw';
  state.drawnThisTurn = false;
  state.selectedOpenIndex = null;
  state.requiredFirstPlayCardId = null;
  state.roundReason = null;
  state.winner = null;
  event(state, 'system', `Round ${state.round} begins. ${getSquad22Card(firstOpen).name} starts the Open Pile.`);
  state.updatedAt = now();
  return state;
}
