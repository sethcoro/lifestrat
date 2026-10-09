-- LifeStrat analytics + feedback schema.
-- Apply in the Supabase SQL editor, or with the Supabase CLI.
-- No account link: rows are keyed only by a random per-install anon_id.

create table if not exists public.events (
  id           bigint generated always as identity primary key,
  anon_id      uuid        not null,
  session_id   uuid        not null,
  run_id       uuid,
  event_type   text        not null check (length(event_type) <= 40),
  props        jsonb       not null default '{}'::jsonb,
  app_version  text,
  platform     text,
  client_ts    timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.feedback (
  id           bigint generated always as identity primary key,
  anon_id      uuid        not null,
  run_id       uuid,
  rating       int         not null check (rating between 1 and 10),
  comment      text        check (length(comment) <= 1000),
  context      jsonb       not null default '{}'::jsonb,
  app_version  text,
  platform     text,
  created_at   timestamptz not null default now()
);

create index if not exists events_type_time on public.events (event_type, created_at);
create index if not exists events_run on public.events (run_id);
create index if not exists events_anon on public.events (anon_id);
create index if not exists feedback_time on public.feedback (created_at);

-- Row Level Security: the public (anon) key can INSERT only. Nobody can read
-- through the app's key. You read data from the Supabase dashboard / SQL editor,
-- or with the service role key on your own machine.
alter table public.events   enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "anon insert events"   on public.events;
drop policy if exists "anon insert feedback" on public.feedback;
create policy "anon insert events"   on public.events   for insert to anon with check (true);
create policy "anon insert feedback" on public.feedback for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- Analysis views (read them in the dashboard; not exposed to the anon key)
-- ---------------------------------------------------------------------------

-- One row per run, with settings and outcome
create or replace view public.runs as
select
  s.run_id,
  s.anon_id,
  s.created_at                           as started_at,
  (s.props->>'age')::int                 as start_age,
  s.props->>'detail'                     as detail,
  s.props->>'difficulty'                 as difficulty,
  e.created_at                           as ended_at,
  e.run_id is not null                   as completed,
  e.props->'stats'                       as final_stats
from public.events s
left join public.events e
  on e.run_id = s.run_id and e.event_type = 'run_end'
where s.event_type = 'run_start';

-- How far do people get, by difficulty? (funnel)
create or replace view public.funnel as
select
  r.difficulty,
  count(*)                                              as runs_started,
  count(*) filter (where r.completed)                   as runs_completed,
  round(100.0 * count(*) filter (where r.completed) / nullif(count(*), 0), 1) as completion_pct
from public.runs r
group by r.difficulty;

-- Option split per episode and part (are choices lopsided?)
create or replace view public.choice_split as
select
  props->>'episode'                      as episode,
  props->>'part'                         as part,
  props->>'option'                       as option,
  count(*)                               as picks,
  round(avg((props->>'ms')::numeric))    as avg_ms_to_decide
from public.events
where event_type = 'choice'
group by 1, 2, 3
order by 1, 2, 3;

-- Where do people quit?
create or replace view public.drop_off as
select props->>'episode' as episode, props->>'part' as part, count(*) as abandons
from public.events
where event_type = 'run_abandon'
group by 1, 2
order by 1, 2;

-- Weekly retention: share of first-week installs that came back in a later week
create or replace view public.retention as
with first_seen as (
  select anon_id, date_trunc('week', min(created_at)) as cohort
  from public.events group by anon_id
),
activity as (
  select distinct anon_id, date_trunc('week', created_at) as wk from public.events
)
select
  f.cohort,
  count(distinct f.anon_id)                                              as users,
  count(distinct a.anon_id) filter (where a.wk > f.cohort)               as returned_later
from first_seen f join activity a using (anon_id)
group by f.cohort
order by f.cohort;

-- Ratings over time and by run settings
create or replace view public.rating_summary as
select
  date_trunc('day', f.created_at)        as day,
  count(*)                               as responses,
  round(avg(f.rating), 2)                as avg_rating
from public.feedback f
group by 1
order by 1;
