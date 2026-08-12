/**
 * Canonical online deck structure reconstructed from the final print artwork.
 *
 * VERIFIED FROM FINAL ART / ARTWORK-ERA COMMITS:
 * - cards 1-44 = 11 football positions x 4 trait colours
 * - card position = ceil(id / 4)
 * - BLUE/CONTROL player set = 2,6,10,14,20,22,28,30,34,38,44
 * - RED player set = 3,7,11,15,17,23,25,31,35,39,41
 * - cards 45-56 = 12 Coaching Staff cards (3 per colour in the print deck)
 * - card 58 = Flex/Joker
 * - final artwork names below match the source PNG filenames
 *
 * The final source bundle does not currently expose a machine-readable map of
 * each printed 5/10 point value. Until that export is recovered, the online
 * beta keeps the scoring map isolated here. This means printed-value corrections
 * never require changing legality, AI, turn flow, persistence, or UI code.
 */

export type TraitColour = 'blue' | 'red' | 'green' | 'yellow';
export type CardKind = 'player' | 'staff' | 'flex';

export interface Squad22Card {
  id: number;
  name: string;
  kind: CardKind;
  position: number | null;
  trait: TraitColour | null;
  points: number;
  image: string;
  pointsVerified: boolean;
}

const NAMES = [
  '',
  'Bertrand', 'Njaso', 'Sophie', 'Faith',
  'Anyoh', 'Abeck', 'Niklas', 'Michael',
  'Indah', 'Carifive', 'James', 'Lars',
  'Ajeck', 'Nji', 'Ashley', 'Fri',
  'Mifi', 'Ewgenij', 'Peace', 'Brun',
  'Bryan', 'Teche', 'Enjeck', 'Kem',
  'Nickson', 'Marco', 'Judith', 'Lum',
  'Ryan', 'Guy', 'Ayria', 'Loveline',
  'Njeck', 'Souley', 'Keren', 'Ayva',
  'Favor', 'Pearly', 'Jayce', 'Yeye',
  'Queen', 'Lara', 'Ali', 'Jaden',
  'Pius', 'Ken', 'Odi', 'Hariet',
  'Vy', 'Tas', 'Jacqui', 'Ngoh',
  'Yega', 'Gwen', 'Rose', 'Aaron',
  'Madonna', 'Anim',
] as const;

const BLUE_PLAYERS = new Set([2, 6, 10, 14, 20, 22, 28, 30, 34, 38, 44]);
const RED_PLAYERS = new Set([3, 7, 11, 15, 17, 23, 25, 31, 35, 39, 41]);

/**
 * The remaining two colour sets are reconstructed from the final deck's
 * four-card-per-position ordering. This ordering exactly reproduces every
 * verified blue/red card from the artwork-era source.
 */
function playerTrait(id: number): TraitColour {
  if (BLUE_PLAYERS.has(id)) return 'blue';
  if (RED_PLAYERS.has(id)) return 'red';

  const position = Math.ceil(id / 4);
  const offset = ((id - 1) % 4) + 1;
  const rotated = position === 5 || position === 7 || position === 11;

  if (!rotated) {
    // [green, blue, red, yellow]
    return offset === 1 ? 'green' : 'yellow';
  }
  // [red, yellow, green, blue]
  return offset === 2 ? 'yellow' : 'green';
}

/**
 * Printed-point map for the online beta.
 *
 * The machine-readable final-art point export is still missing from the repo.
 * All player cards therefore default to 10 for beta match arithmetic. Staff are
 * confirmed +10 and Flex is confirmed 0 on table / -15 in hand. Keep this map
 * centralized so the final 5-point IDs can be replaced atomically once recovered.
 */
const PRINTED_PLAYER_POINTS: Partial<Record<number, 5 | 10>> = {};

function cardImage(id: number) {
  return `/images/cards/${String(id).padStart(2, '0')}.webp`;
}

const players: Squad22Card[] = Array.from({ length: 44 }, (_, idx) => {
  const id = idx + 1;
  const mapped = PRINTED_PLAYER_POINTS[id];
  return {
    id,
    name: NAMES[id],
    kind: 'player',
    position: Math.ceil(id / 4),
    trait: playerTrait(id),
    points: mapped ?? 10,
    image: cardImage(id),
    pointsVerified: mapped !== undefined,
  };
});

const staff: Squad22Card[] = Array.from({ length: 12 }, (_, idx) => {
  const id = 45 + idx;
  return {
    id,
    name: NAMES[id],
    kind: 'staff',
    position: null,
    trait: null,
    points: 10,
    image: cardImage(id),
    pointsVerified: true,
  };
});

// 44 player + 12 staff = 56 cards, leaving exactly two special cards in the
// 58-card deck. The approved rules refer to Flex Cards in the plural and card
// 58 is explicitly verified as the Joker/Flex. Card 57 is therefore treated as
// the structurally reconstructed second Flex card, while 58 remains art-verified.
const flex: Squad22Card[] = [57, 58].map((id) => ({
  id,
  name: NAMES[id],
  kind: 'flex' as const,
  position: null,
  trait: null,
  points: 0,
  image: cardImage(id),
  pointsVerified: id === 58,
}));

export const SQUAD22_DECK: readonly Squad22Card[] = [...players, ...staff, ...flex];

export const CARD_BY_ID = new Map(SQUAD22_DECK.map((card) => [card.id, card]));

export function getSquad22Card(id: number): Squad22Card {
  const card = CARD_BY_ID.get(id);
  if (!card) throw new Error(`Unknown Squad22 card ${id}`);
  return card;
}

export function shuffleIds(random: () => number = Math.random): number[] {
  const deck = SQUAD22_DECK.map((card) => card.id);
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const TRAIT_LABELS: Record<TraitColour, string> = {
  blue: 'CONTROL',
  red: 'RED',
  green: 'GREEN',
  yellow: 'YELLOW',
};

export const DECK_METADATA_STATUS = {
  positions: 'verified',
  blueAndRedTraits: 'verified',
  greenAndYellowTraits: 'reconstructed',
  staffIds: 'verified',
  flex58: 'verified',
  flex57: 'reconstructed',
  playerPoints: 'provisional',
} as const;
