-- Squad22 canonical card catalog + verification status.
-- This table makes the remaining artwork-verification gaps explicit instead
-- of letting provisional metadata masquerade as final game rules.

create table if not exists public.squad22_card_catalog (
  card_id integer primary key check (card_id between 1 and 58),
  name text not null,
  kind text not null check (kind in ('player','staff','flex')),
  position integer check (position between 1 and 11),
  trait text check (trait in ('blue','red','green','yellow')),
  points integer not null check (points in (0,5,10)),
  position_status text not null default 'verified' check (position_status in ('verified','reconstructed','provisional')),
  trait_status text not null default 'verified' check (trait_status in ('verified','reconstructed','provisional','not_applicable')),
  points_status text not null default 'provisional' check (points_status in ('verified','reconstructed','provisional')),
  role_status text not null default 'verified' check (role_status in ('verified','reconstructed','provisional')),
  source_note text,
  updated_at timestamptz not null default now()
);

alter table public.squad22_card_catalog enable row level security;
drop policy if exists "squad22 card catalog public read" on public.squad22_card_catalog;
create policy "squad22 card catalog public read"
on public.squad22_card_catalog for select using (true);

create index if not exists squad22_card_catalog_kind_idx on public.squad22_card_catalog(kind);
create index if not exists squad22_card_catalog_position_idx on public.squad22_card_catalog(position);
create index if not exists squad22_card_catalog_trait_idx on public.squad22_card_catalog(trait);

with names as (
  select array[
    'Bertrand','Njaso','Sophie','Faith','Anyoh','Abeck','Niklas','Michael','Indah','Carifive','James','Lars',
    'Ajeck','Nji','Ashley','Fri','Mifi','Ewgenij','Peace','Brun','Bryan','Teche','Enjeck','Kem','Nickson','Marco',
    'Judith','Lum','Ryan','Guy','Ayria','Loveline','Njeck','Souley','Keren','Ayva','Favor','Pearly','Jayce','Yeye',
    'Queen','Lara','Ali','Jaden','Pius','Ken','Odi','Hariet','Vy','Tas','Jacqui','Ngoh','Yega','Gwen','Rose','Aaron',
    'Madonna','Anim'
  ]::text[] as a
), cards as (
  select
    id as card_id,
    (select a[id] from names) as name,
    case when id <= 44 then 'player' when id <= 56 then 'staff' else 'flex' end as kind,
    case when id <= 44 then ceil(id / 4.0)::int else null end as position,
    case
      when id > 44 then null
      when id = any(array[2,6,10,14,20,22,28,30,34,38,44]) then 'blue'
      when id = any(array[3,7,11,15,17,23,25,31,35,39,41]) then 'red'
      when ceil(id / 4.0)::int = any(array[5,7,11])
        then case when ((id - 1) % 4) + 1 = 2 then 'yellow' else 'green' end
      else case when ((id - 1) % 4) + 1 = 1 then 'green' else 'yellow' end
    end as trait,
    case when id <= 56 then 10 else 0 end as points,
    'verified' as position_status,
    case
      when id > 44 then 'not_applicable'
      when id = any(array[2,6,10,14,20,22,28,30,34,38,44,3,7,11,15,17,23,25,31,35,39,41]) then 'verified'
      else 'reconstructed'
    end as trait_status,
    case when id between 45 and 56 or id = 58 then 'verified' when id = 57 then 'reconstructed' else 'provisional' end as points_status,
    case when id = 57 then 'reconstructed' else 'verified' end as role_status
  from generate_series(1,58) id
)
insert into public.squad22_card_catalog
(card_id,name,kind,position,trait,points,position_status,trait_status,points_status,role_status,source_note)
select card_id,name,kind,position,trait,points,position_status,trait_status,points_status,role_status,
       case when card_id=57 then 'Deck structure: 44 player + 12 staff leaves 2 Flex cards; card 58 is verified Joker/Flex and approved rules refer to Flex Cards in plural. Card 57 reconstructed as second Flex.' else 'Final artwork structure and artwork-era commits. Verification columns explicitly identify remaining metadata gaps.' end
from cards
on conflict (card_id) do update set
  name=excluded.name,
  kind=excluded.kind,
  position=excluded.position,
  trait=excluded.trait,
  points=excluded.points,
  position_status=excluded.position_status,
  trait_status=excluded.trait_status,
  points_status=excluded.points_status,
  role_status=excluded.role_status,
  source_note=excluded.source_note,
  updated_at=now();
