-- Applied to Tichi Ventures / phhpiqwvgwlgjmyiksqe on 2026-08-11.
-- Squad22-only namespace; no existing project tables are modified.

create table if not exists public.squad22_product_config (
  product_key text primary key,
  display_name text not null,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  billing_model text not null check (billing_model in ('free','one_time')),
  visible boolean not null default true,
  available_for_purchase boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.squad22_rules_versions (
  version text primary key,
  status text not null check (status in ('draft','active','retired')),
  rules jsonb not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.squad22_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  stats jsonb not null default '{"matches":0,"wins":0,"losses":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.squad22_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null references public.squad22_product_config(product_key),
  status text not null default 'active' check (status in ('active','revoked')),
  source text not null default 'manual' check (source in ('manual','stripe','promo')),
  source_ref text,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (user_id, product_key)
);

create table if not exists public.squad22_matches (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'solo_ai' check (mode in ('solo_ai','multiplayer')),
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  rules_version text not null references public.squad22_rules_versions(version),
  target_score integer not null default 300 check (target_score in (300,500,600)),
  hand_size integer not null default 7 check (hand_size in (5,7)),
  formation text not null default '4-4-2' check (formation in ('4-4-2','4-3-3','3-5-2','5-3-2')),
  state jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.squad22_match_events (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.squad22_matches(id) on delete cascade,
  seq integer not null check (seq >= 0),
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_id, seq)
);

insert into public.squad22_product_config
(product_key, display_name, price_cents, currency, billing_model, visible, available_for_purchase, metadata)
values
('tactical_demo','Squad22 Tactical Demo',0,'usd','free',true,true,'{"cta":"Play free"}'),
('online_full','Squad22 Online — Launch Edition',1499,'usd','one_time',true,false,'{"label":"Launch price","promise":"Pay once. Play forever.","payments":"disabled_until_launch_ready"}'),
('physical_edition','Squad22 Physical Edition',2499,'usd','one_time',true,false,'{"shipping":"additional","fulfillment":"print_on_demand_planned","status":"planned"}')
on conflict (product_key) do update set
  display_name=excluded.display_name, price_cents=excluded.price_cents,
  currency=excluded.currency, billing_model=excluded.billing_model,
  visible=excluded.visible, available_for_purchase=excluded.available_for_purchase,
  metadata=excluded.metadata, updated_at=now();

insert into public.squad22_rules_versions(version,status,rules,activated_at)
values('2026-08-core','active','{
  "players":"2-6","target_scores":[300,500,600],"hand_sizes":[5,7],"deck_size":58,
  "full_squad":{"players":22,"staff":3,"bonus":50},
  "turn":["draw_from_one_pile","play_any_number_of_legal_cards","discard_one_unless_hand_empty"],
  "open_pile":{"take_only_if_desired_card_can_be_played_immediately":true,"take_all_cards_above_desired":true},
  "position_pair":{"cards":2,"same_position":true,"opens_and_completes_local_position":true},
  "trait_triple":{"cards":3,"same_trait":true,"different_positions":true,"opens_positions_for_every_player":true},
  "globally_open_position":{"any_player_may_start_on_own_squad_with_one_matching_position_card":true,"second_matching_position_card_may_be_added_later":true},
  "flex":{"may_play_in_any_position":true,"table_points":0,"hand_penalty":-15},
  "scoring":{"ten_point":{"table":10,"hand":-10},"five_point":{"table":5,"hand":-5},"staff":{"table":10,"hand":-10}},
  "round_end":["hand_empty","draw_pile_empty","full_squad"]
}',now())
on conflict (version) do update set status=excluded.status,rules=excluded.rules,activated_at=excluded.activated_at;

alter table public.squad22_product_config enable row level security;
alter table public.squad22_rules_versions enable row level security;
alter table public.squad22_profiles enable row level security;
alter table public.squad22_entitlements enable row level security;
alter table public.squad22_matches enable row level security;
alter table public.squad22_match_events enable row level security;

drop policy if exists "squad22 product config public read" on public.squad22_product_config;
create policy "squad22 product config public read" on public.squad22_product_config for select using (visible=true);
drop policy if exists "squad22 active rules public read" on public.squad22_rules_versions;
create policy "squad22 active rules public read" on public.squad22_rules_versions for select using (status='active');
drop policy if exists "squad22 profile own read" on public.squad22_profiles;
create policy "squad22 profile own read" on public.squad22_profiles for select to authenticated using (user_id=auth.uid());
drop policy if exists "squad22 profile own insert" on public.squad22_profiles;
create policy "squad22 profile own insert" on public.squad22_profiles for insert to authenticated with check (user_id=auth.uid());
drop policy if exists "squad22 profile own update" on public.squad22_profiles;
create policy "squad22 profile own update" on public.squad22_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
drop policy if exists "squad22 entitlement own read" on public.squad22_entitlements;
create policy "squad22 entitlement own read" on public.squad22_entitlements for select to authenticated using (user_id=auth.uid());
drop policy if exists "squad22 match own read" on public.squad22_matches;
create policy "squad22 match own read" on public.squad22_matches for select to authenticated using (owner_user_id=auth.uid());
drop policy if exists "squad22 solo match own insert" on public.squad22_matches;
create policy "squad22 solo match own insert" on public.squad22_matches for insert to authenticated with check (owner_user_id=auth.uid() and mode='solo_ai');
drop policy if exists "squad22 solo match own update" on public.squad22_matches;
create policy "squad22 solo match own update" on public.squad22_matches for update to authenticated using (owner_user_id=auth.uid() and mode='solo_ai') with check (owner_user_id=auth.uid() and mode='solo_ai');
drop policy if exists "squad22 event owner read" on public.squad22_match_events;
create policy "squad22 event owner read" on public.squad22_match_events for select to authenticated using (exists(select 1 from public.squad22_matches m where m.id=match_id and m.owner_user_id=auth.uid()));
drop policy if exists "squad22 solo event owner insert" on public.squad22_match_events;
create policy "squad22 solo event owner insert" on public.squad22_match_events for insert to authenticated with check (actor_user_id=auth.uid() and exists(select 1 from public.squad22_matches m where m.id=match_id and m.owner_user_id=auth.uid() and m.mode='solo_ai'));

create index if not exists squad22_matches_owner_created_idx on public.squad22_matches(owner_user_id,created_at desc);
create index if not exists squad22_match_events_match_seq_idx on public.squad22_match_events(match_id,seq);
create index if not exists squad22_entitlements_user_status_idx on public.squad22_entitlements(user_id,status);
