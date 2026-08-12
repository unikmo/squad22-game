import { NextRequest, NextResponse } from 'next/server';
import { checkoutEnabled, createSquad22CheckoutSession, getSupabaseUser, requireStripeConfig } from '@/lib/squad22/stripeServer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!checkoutEnabled()) {
    return NextResponse.json({ ok: false, error: 'Checkout is not enabled yet.' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });

  try {
    const user = await getSupabaseUser(token);
    if (!user?.id) return NextResponse.json({ ok: false, error: 'Invalid session.' }, { status: 401 });

    const { secretKey, priceId } = requireStripeConfig();
    const origin = request.nextUrl.origin;
    const session = await createSquad22CheckoutSession({
      secretKey,
      priceId,
      userId: user.id,
      email: user.email,
      origin,
    });

    return NextResponse.json({ ok: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Squad22 checkout creation failed', error);
    return NextResponse.json({ ok: false, error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }
}
