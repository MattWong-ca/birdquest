-- ============================================================================
-- Quests table + leaderboard RPC
-- Run this in the Supabase SQL editor (or via CLI migration).
-- ============================================================================

-- 1. Quests table
create table if not exists public.quests (
  id            uuid primary key default gen_random_uuid(),
  sponsor_name  text not null,
  sponsor_logo  text,
  prize_pool    bigint not null,            -- prize in tinybars (1 HBAR = 100_000_000)
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  top_n         integer not null default 3,
  status        text not null default 'active'
                  check (status in ('active', 'distributing', 'completed')),
  schedule_id   text,                      -- Hedera Schedule ID (set on distribution)
  created_at    timestamptz not null default now()
);

-- 2. Leaderboard RPC — aggregates trip scores per user within a quest window
--    Returns rows ordered by total_score DESC.
create or replace function public.quest_leaderboard(
  quest_start timestamptz,
  quest_end   timestamptz
)
returns table (
  wallet_address text,
  username       text,
  total_score    bigint
)
language sql stable
as $$
  select
    t.wallet_address,
    t.username,
    sum(t.score)::bigint as total_score
  from public.trips t
  where t.logged_at >= quest_start
    and t.logged_at <= quest_end
  group by t.wallet_address, t.username
  order by total_score desc;
$$;
