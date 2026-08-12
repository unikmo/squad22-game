import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseUser } from '@/lib/squad22/stripeServer';

export const runtime = 'nodejs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://phhpiqwvgwlgjmyiksqe.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
  if (!SUPABASE_KEY) return NextResponse.json({ ok: false, error: 'Configuration unavailable.' }, { status: 503 });

  try {
    const user = await getSupabaseUser(token);
    if (!user?.id) return NextResponse.json({ ok: false, error: 'Invalid session.' }, { status: 401 });

    const params = new URLSearchParams({
      select: 'product_key,status,source,granted_at,expires_at',
      user_id: `eq.${user.id}`,
      product_key: 'eq.online_full',
      status: 'eq.active',
      limit: '1',
    });

    const response = await fetch(`${SUPABASE_URL}/rest/v1/squad22_entitlements?${params.toString()}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Entitlement read failed: ${response.status}`);

    const rows = await response.json() as Array<{
      product_key: string;
      status: string;
      source: string;
      granted_at: string;
      expires_at: string | null;
    }>;

    return NextResponse.json({ ok: true, entitled: rows.length > 0, entitlement: rows[0] ?? null });
  } catch (error) {
    console.error('Squad22 entitlement check failed', error);
    return NextResponse.json({ ok: false, error: 'Entitlement check unavailable.' }, { status: 503 });
  }
}
