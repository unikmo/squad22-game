import { NextResponse } from 'next/server';

/**
 * The previous endpoint instantiated the legacy in-memory match engine, whose
 * card database and Trait Triple behavior are not the current canonical game.
 * Keep the route explicit rather than silently creating rules-wrong matches.
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      code: 'FULL_MATCH_ENGINE_IN_BUILD',
      message: 'The full online match engine is not enabled yet. Use the tactical demo at /game.',
      demo: '/game',
    },
    { status: 501 },
  );
}
