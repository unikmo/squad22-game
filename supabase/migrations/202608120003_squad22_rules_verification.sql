-- Keep rules confidence explicit. Core turn/scoring behavior is verified from
-- the approved quick guide. Staff placement is reconstructed because the
-- guide defines Staff scoring/full-squad requirements but not a separate play action.

update public.squad22_rules_versions
set rules = rules || jsonb_build_object(
  'staff_play', jsonb_build_object(
    'single_card_into_staff_slot', true,
    'max_staff', 3,
    'verification_status', 'reconstructed'
  ),
  'verification', jsonb_build_object(
    'core_turn_flow', 'verified',
    'position_pair', 'verified',
    'trait_triple_global_open', 'verified',
    'open_pile_immediate_play', 'verified',
    'round_end_and_scoring', 'verified',
    'staff_placement_action', 'reconstructed',
    'player_card_point_map', 'provisional'
  )
)
where version='2026-08-core';
