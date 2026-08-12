import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://phhpiqwvgwlgjmyiksqe.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_Di0kT3dAcoP9dHlBrg-rHQ_ISw-26-9';

async function readTable(path: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Supabase config read failed: ${response.status}`);
  }

  return response.json();
}

export async function GET() {
  try {
    const [products, rules] = await Promise.all([
      readTable('squad22_product_config?select=product_key,display_name,price_cents,currency,billing_model,visible,available_for_purchase,metadata&visible=eq.true&order=price_cents.asc'),
      readTable('squad22_rules_versions?select=version,status,rules&status=eq.active&limit=1'),
    ]);

    return NextResponse.json({
      ok: true,
      products,
      rules: rules[0] ?? null,
    });
  } catch (error) {
    console.error('Squad22 public config error', error);
    return NextResponse.json(
      { ok: false, error: 'Configuration unavailable' },
      { status: 503 },
    );
  }
}
