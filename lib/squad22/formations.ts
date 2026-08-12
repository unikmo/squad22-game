import type { Formation } from './engine';

/**
 * Formation presentation map for the online pitch.
 *
 * Squad22's approved rules require one of these four formations and state that
 * the chosen shape determines the lineup, while numbered-card legality itself
 * is still governed by Position Pair / Trait Triple / global openings.
 *
 * This map therefore controls where the 11 numbered positions appear on the
 * pitch. It does NOT invent extra card-play restrictions that are absent from
 * the current approved quick guide.
 */
export const FORMATION_LINES: Record<Formation, {
  forwards: readonly number[];
  midfield: readonly number[];
  defence: readonly number[];
  goalkeeper: readonly number[];
}> = {
  '4-4-2': {
    forwards: [9, 10],
    midfield: [6, 7, 8, 11],
    defence: [2, 3, 4, 5],
    goalkeeper: [1],
  },
  '4-3-3': {
    forwards: [7, 9, 11],
    midfield: [6, 8, 10],
    defence: [2, 3, 4, 5],
    goalkeeper: [1],
  },
  '3-5-2': {
    forwards: [9, 10],
    midfield: [5, 6, 7, 8, 11],
    defence: [2, 3, 4],
    goalkeeper: [1],
  },
  '5-3-2': {
    forwards: [9, 10],
    midfield: [5, 6, 8],
    defence: [2, 3, 4, 7, 11],
    goalkeeper: [1],
  },
};

const COLUMNS: Record<number, readonly number[]> = {
  1: [3],
  2: [2, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
};

export function formationSlotGrid(formation: Formation): Record<number, { column: number; row: number; line: 'GK' | 'DEF' | 'MID' | 'FWD' }> {
  const lines = FORMATION_LINES[formation];
  const result: Record<number, { column: number; row: number; line: 'GK' | 'DEF' | 'MID' | 'FWD' }> = {};

  const place = (positions: readonly number[], row: number, line: 'GK' | 'DEF' | 'MID' | 'FWD') => {
    const columns = COLUMNS[positions.length];
    if (!columns) throw new Error(`Unsupported formation line length ${positions.length}`);
    positions.forEach((position, index) => {
      result[position] = { column: columns[index], row, line };
    });
  };

  place(lines.forwards, 1, 'FWD');
  place(lines.midfield, 2, 'MID');
  place(lines.defence, 3, 'DEF');
  place(lines.goalkeeper, 4, 'GK');
  return result;
}
