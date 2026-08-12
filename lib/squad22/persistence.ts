'use client';

import { supabase } from '@/lib/supabase';
import type { MatchState } from './engine';

const LOCAL_KEY = 'squad22.full-match.v1';

export type SaveStatus = 'idle' | 'local' | 'cloud' | 'error';

export function loadLocalMatch(): MatchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchState;
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function clearLocalMatch() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(LOCAL_KEY);
}

export function saveLocalMatch(state: MatchState) {
  if (typeof window !== 'undefined') window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

async function anonymousUserId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) return sessionData.session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

/**
 * Anonymous Supabase users are auth.users rows, so existing owner RLS remains
 * intact. If anonymous auth is disabled, local persistence remains functional.
 */
export async function saveMatchCloud(state: MatchState): Promise<{ status: SaveStatus; cloudId?: string }> {
  saveLocalMatch(state);
  try {
    const userId = await anonymousUserId();
    if (!userId) return { status: 'local' };

    const pointerKey = `${LOCAL_KEY}.cloudId`;
    const cloudId = typeof window !== 'undefined' ? window.localStorage.getItem(pointerKey) : null;
    const payload = {
      owner_user_id: userId,
      mode: 'solo_ai',
      status: state.phase === 'match-end' ? 'completed' : 'active',
      rules_version: '2026-08-core',
      target_score: state.targetScore,
      hand_size: state.handSize,
      formation: state.formation,
      state,
      result: state.phase === 'match-end' ? { winner: state.winner, scores: state.players.map((player) => player.totalScore) } : null,
      updated_at: new Date().toISOString(),
      ...(state.phase === 'match-end' ? { completed_at: new Date().toISOString() } : {}),
    };

    if (cloudId) {
      const { error } = await supabase.from('squad22_matches').update(payload).eq('id', cloudId);
      if (!error) return { status: 'cloud', cloudId };
    }

    const { data, error } = await supabase.from('squad22_matches').insert(payload).select('id').single();
    if (error || !data?.id) return { status: 'local' };
    if (typeof window !== 'undefined') window.localStorage.setItem(pointerKey, data.id);
    return { status: 'cloud', cloudId: data.id };
  } catch {
    return { status: 'local' };
  }
}

export function clearCloudPointer() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(`${LOCAL_KEY}.cloudId`);
}
