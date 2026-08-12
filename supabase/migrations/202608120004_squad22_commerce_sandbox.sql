-- Stripe sandbox commerce metadata only. Production purchase availability stays OFF.
update public.squad22_product_config
set
  price_cents = 1499,
  currency = 'usd',
  billing_model = 'one_time',
  available_for_purchase = false,
  metadata = metadata || jsonb_build_object(
    'label', 'Launch price',
    'promise', 'Pay once. Play forever.',
    'stripe_sandbox_product_id', 'prod_V3dOugFUUPmhgU',
    'stripe_sandbox_price_id', 'price_1U3W7kCIFQh1oigOORWUHsbr',
    'checkout_gate', 'disabled_in_production_until_explicit_approval',
    'entitlement_mode', 'webhook_upsert'
  ),
  updated_at = now()
where product_key = 'online_full';
