import { NextRequest, NextResponse } from 'next/server';
import { grantStripeEntitlement, verifyStripeSignature } from '@/lib/squad22/stripeServer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) return NextResponse.json({ ok: false }, { status: 400 });

  const rawBody = await request.text();
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: { object?: {
        id?: string;
        payment_status?: string;
        client_reference_id?: string | null;
        metadata?: Record<string, string | undefined>;
      } };
    };

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const productKey = session?.metadata?.product_key;
      const userId = session?.metadata?.user_id || session?.client_reference_id || undefined;
      if (session?.payment_status === 'paid' && productKey === 'online_full' && userId && session.id) {
        await grantStripeEntitlement({ userId, sessionId: session.id });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Squad22 Stripe webhook failed', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
