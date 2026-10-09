-- Add game mode and scenario to the analysis views.
-- Life runs: scenario = episode title. Situation runs: scenario = situation title.

drop view if exists public.choice_split;
drop view if exists public.funnel;
drop view if exists public.runs;

create view public.runs as
select
  s.run_id,
  s.anon_id,
  s.created_at                           as started_at,
  coalesce(s.props->>'mode', 'life')     as mode,
  s.props->>'scenario'                   as scenario,
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

create view public.funnel as
select
  r.mode,
  r.difficulty,
  count(*)                                              as runs_started,
  count(*) filter (where r.completed)                   as runs_completed,
  round(100.0 * count(*) filter (where r.completed) / nullif(count(*), 0), 1) as completion_pct
from public.runs r
group by r.mode, r.difficulty;

create view public.choice_split as
select
  coalesce(props->>'mode', 'life')       as mode,
  props->>'scenario'                     as scenario,
  props->>'episode'                      as episode,
  props->>'part'                         as part,
  props->>'option'                       as option,
  count(*)                               as picks,
  round(avg((props->>'ms')::numeric))    as avg_ms_to_decide
from public.events
where event_type = 'choice'
group by 1, 2, 3, 4, 5
order by 1, 2, 3, 4, 5;

alter view public.runs         set (security_invoker = on);
alter view public.funnel       set (security_invoker = on);
alter view public.choice_split set (security_invoker = on);
revoke all on public.runs, public.funnel, public.choice_split from anon, authenticated;
