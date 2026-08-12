import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_SUPABASE_URL = 'https://phhpiqwvgwlgjmyiksqe.supabase.co';

export function checkoutEnabled() {
  return process.env.SQUAD22_CHECKOUT_ENABLED === 'true';
}

export function requireStripeConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_SQUAD22_PRICE_ID;
  if (!secretKey || !priceId) throw new Error('Stripe sandbox configuration is incomplete');
  return { secretKey, priceId };
}

export async function getSupabaseUser(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publishableKey) throw new Error('Supabase publishable key is missing');

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json() as Promise<{ id: string; email?: string | null }>;
}

export async function createSquad22CheckoutSession(args: {
  secretKey: string;
  priceId: string;
  userId: string;
  email?: string | null;
  origin: string;
}) {
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('line_items[0][price]', args.priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${args.origin}/play?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${args.origin}/play?checkout=cancelled`);
  params.set('client_reference_id', args.userId);
  params.set('metadata[user_id]', args.userId);
  params.set('metadata[product_key]', 'online_full');
  params.set('payment_intent_data[metadata][user_id]', args.userId);
  params.set('payment_intent_data[metadata][product_key]', 'online_full');
  if (args.email) params.set('customer_email', args.email);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
    cache: 'no-store',
  });

  const payload = await response.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!response.ok || !payload.id || !payload.url) {
    throw new Error(payload.error?.message || `Stripe checkout failed: ${response.status}`);
  }
  return { id: payload.id, url: payload.url };
}

export function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string, toleranceSeconds = 300) {
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return signatures.some((signature) => {
    try {
      const actual = Buffer.from(signature, 'hex');
      return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
    } catch {
      return false;
    }
  });
}

export async function grantStripeEntitlement(args: { userId: string; sessionId: string }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) throw new Error('Supabase service role key is missing');

  const response = await fetch(`${url}/rest/v1/squad22_entitlements?on_conflict=user_id,product_key`, {
    method: 'POST',
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: args.userId,
      product_key: 'online_full',
      status: 'active',
      source: 'stripe',
      source_ref: args.sessionId,
      expires_at: null,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase entitlement upsert failed: ${response.status}`);
}
