export type StatKey = 'satisfaction' | 'health' | 'relationships' | 'seniority' | 'influence' | 'netWorth';
export type Fx = Partial<Record<StatKey, number>>;
export type Stats = Record<StatKey, number>;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Detail = 'Quick' | 'Detailed';

export const STAT_LABELS: Record<StatKey, string> = {
  satisfaction: 'satisf.',
  health: 'health',
  relationships: 'relation.',
  seniority: 'senior.',
  influence: 'influence',
  netWorth: 'net worth',
};

export interface Option { text: string; fx: Fx; note: string }
export interface Part { situation: string; a: Option; b: Option }
export interface Episode {
  title: string;
  age: number;
  partA: Part;
  partB: { a: Part; b: Part };
  result: { a: string; b: string };
}

// Fake story data. Replaced by AI-generated turns once the backend exists.
export const EPISODES: Episode[] = [
  {
    title: 'The quiz',
    age: 14,
    partA: {
      situation: "Sunday night. You have an algebra quiz tomorrow worth 20% of your grade and haven't opened the book. Your best friend Dani texts: \"new game just dropped, come over.\"",
      a: { text: 'Stay home and study.', fx: { seniority: 5, satisfaction: -3 }, note: 'You study. Dani sulks a little.' },
      b: { text: "Go to Dani's and wing it.", fx: { satisfaction: 8, relationships: 6 }, note: 'Best night in weeks.' },
    },
    partB: {
      a: {
        situation: 'You ace the quiz. Dani jokes that you have gone soft and invites you again on Friday, a school night.',
        a: { text: 'Go anyway.', fx: { relationships: 5, seniority: -2 }, note: 'You are back in the group chat.' },
        b: { text: 'Stay disciplined.', fx: { seniority: 4, relationships: -3 }, note: 'Dani goes quiet for a few days.' },
      },
      b: {
        situation: 'The quiz comes back: 62%. Mr. Okafor offers to replace it if you give up your lunches for two weeks.',
        a: { text: 'Give up your lunches.', fx: { seniority: 9, relationships: -3, satisfaction: -3 }, note: 'Your grade becomes an 88%.' },
        b: { text: 'Keep your lunch table.', fx: { relationships: 4, seniority: -4 }, note: 'The 62% stays.' },
      },
    },
    result: {
      a: 'You put school first and it showed. Teachers started to notice you.',
      b: 'You learned what a bad night costs, and what it takes to climb back.',
    },
  },
  {
    title: 'Biscuit',
    age: 14,
    partA: {
      situation: "Your neighbor offers $20 a week to walk her beagle, Biscuit. The same hour is math club.",
      a: { text: 'Join math club.', fx: { seniority: 4, influence: 3 }, note: 'You meet people who like numbers.' },
      b: { text: 'Walk Biscuit for $20.', fx: { netWorth: 80, health: 3, influence: 2 }, note: 'Four weeks, four twenties.' },
    },
    partB: {
      a: {
        situation: 'The club enters a regional contest. It is the same weekend as a friend\'s birthday.',
        a: { text: 'Compete.', fx: { seniority: 5, influence: 3, relationships: -3 }, note: 'You place third.' },
        b: { text: 'Go to the party.', fx: { relationships: 6, satisfaction: 4 }, note: 'The team finds a replacement.' },
      },
      b: {
        situation: 'Mrs. Alvarez offers $60 for a full weekend of dog-sitting. It is the same Saturday as Dani\'s first birthday party.',
        a: { text: 'Take the $60.', fx: { netWorth: 60, relationships: -6 }, note: 'Dani is hurt.' },
        b: { text: "Go to Dani's party.", fx: { relationships: 7, satisfaction: 5 }, note: 'You were there.' },
      },
    },
    result: {
      a: 'You became part of something, even if the pay was zero.',
      b: 'You learned what your time is worth, and who you spend it on.',
    },
  },
  {
    title: 'The choice of school',
    age: 17,
    partA: {
      situation: 'Applications are due. Your counselor says you could aim high with some real effort, or play it safe.',
      a: { text: 'Push for a reach school.', fx: { seniority: 5, satisfaction: -4, health: -3 }, note: 'Late nights and essay drafts.' },
      b: { text: 'Apply to safe schools.', fx: { satisfaction: 4, health: 2 }, note: 'Easy, and it works.' },
    },
    partB: {
      a: {
        situation: 'A thin envelope arrives from the reach school, a waitlist offer. A safe school has already sent you a scholarship.',
        a: { text: 'Wait for the reach school.', fx: { influence: 3, satisfaction: -3 }, note: 'You hold your breath all summer.' },
        b: { text: 'Take the scholarship.', fx: { netWorth: 500, satisfaction: 4 }, note: 'Less debt, fewer doors.' },
      },
      b: {
        situation: 'Your safe school offers a place in an honors program, but it requires a long extra application.',
        a: { text: 'Do the extra work.', fx: { seniority: 4, influence: 2, satisfaction: -2 }, note: 'You get in.' },
        b: { text: 'Skip it.', fx: { satisfaction: 3, health: 2 }, note: 'You have a free summer.' },
      },
    },
    result: {
      a: 'You aimed high and the world answered, part yes and part not yet.',
      b: 'You chose comfort. It was a good life, and the road was easy.',
    },
  },
  {
    title: 'The roommate',
    age: 19,
    partA: {
      situation: 'Your roommate Sam parties every weekend and wants you in. Midterms start in ten days.',
      a: { text: 'Join the parties.', fx: { satisfaction: 6, relationships: 5, health: -4, seniority: -3 }, note: 'You have never met so many people.' },
      b: { text: 'Hold the line and study.', fx: { seniority: 5, relationships: -3 }, note: 'The room is quiet and so are you.' },
    },
    partB: {
      a: {
        situation: 'Sam has a fake-ID idea that could get you both into the best clubs in town.',
        a: { text: 'Do it.', fx: { satisfaction: 4, influence: 2, health: -3 }, note: 'You got in, and got a warning from campus police.' },
        b: { text: 'Pass.', fx: { relationships: -2, seniority: 2 }, note: 'Sam rolls his eyes.' },
      },
      b: {
        situation: 'Sam is struggling with his classes and asks you to help him cram. It costs your study time.',
        a: { text: 'Help Sam.', fx: { relationships: 6, seniority: -2 }, note: 'He passes, and he owes you.' },
        b: { text: 'Say no.', fx: { seniority: 3, relationships: -5 }, note: 'He fails the exam.' },
      },
    },
    result: {
      a: 'College gave you a social life, and you paid for it with sleep.',
      b: 'You were disciplined, and a little lonely about it.',
    },
  },
  {
    title: 'The internship',
    age: 21,
    partA: {
      situation: 'Two summer internships: a prestigious but unpaid one at a big firm, or a paid job at a small startup.',
      a: { text: 'Prestigious and unpaid.', fx: { seniority: 6, influence: 4, netWorth: -300 }, note: 'Good name on the resume, empty wallet.' },
      b: { text: 'Paid at the startup.', fx: { netWorth: 600, influence: 2 }, note: 'You do real work from day one.' },
    },
    partB: {
      a: {
        situation: 'A senior manager offers to be your mentor, but only if you work through the holiday weekend.',
        a: { text: 'Accept.', fx: { seniority: 5, influence: 4, relationships: -3 }, note: 'He gives you a name to drop.' },
        b: { text: 'Take the weekend off.', fx: { satisfaction: 4, health: 3 }, note: 'He seems unimpressed.' },
      },
      b: {
        situation: 'The startup\'s founder offers you a small equity stake instead of a raise.',
        a: { text: 'Take the equity.', fx: { influence: 4, netWorth: -100, seniority: 3 }, note: 'You are now a tiny owner.' },
        b: { text: 'Ask for the raise.', fx: { netWorth: 300, seniority: 1 }, note: 'Safe, steady money.' },
      },
    },
    result: {
      a: 'You invested in your future instead of your bank account.',
      b: 'You earned while you learned, and kept your options open.',
    },
  },
  {
    title: 'The offer',
    age: 24,
    partA: {
      situation: 'You get two job offers: a stable corporate role with great benefits, or a risky startup with big upside.',
      a: { text: 'Stable corporate job.', fx: { netWorth: 800, health: 2, seniority: 3 }, note: 'Predictable, and kind of dull.' },
      b: { text: 'Risky startup.', fx: { satisfaction: 4, influence: 3, netWorth: 200, health: -3 }, note: 'The hours are brutal.' },
    },
    partB: {
      a: {
        situation: 'Two years in, your boss offers you a promotion with a transfer to a city away from your friends.',
        a: { text: 'Accept the move.', fx: { seniority: 8, netWorth: 1500, relationships: -6 }, note: 'New desk, new loneliness.' },
        b: { text: 'Stay put.', fx: { relationships: 5, satisfaction: 3 }, note: 'The promotion goes to someone else.' },
      },
      b: {
        situation: 'The startup runs out of money in six months. A rival offers you a job right now.',
        a: { text: 'Jump ship.', fx: { netWorth: 900, seniority: 3, relationships: -2 }, note: 'You are safe. Your cofounders are not happy.' },
        b: { text: 'Ride it out.', fx: { influence: 5, netWorth: -400, satisfaction: 2 }, note: 'You save the company, barely, for a while.' },
      },
    },
    result: {
      a: 'You chose security, and it cost you the road not taken.',
      b: 'You bet on yourself. Sometimes that pays.',
    },
  },
  {
    title: 'The long view',
    age: 30,
    partA: {
      situation: 'You have a decent life, but a quiet question keeps coming back: what is all of this for?',
      a: { text: 'Chase the next promotion.', fx: { seniority: 6, influence: 4, health: -4, satisfaction: -2 }, note: 'You are a rising star.' },
      b: { text: 'Invest in the people you love.', fx: { relationships: 8, satisfaction: 6, seniority: -2 }, note: 'You are home for dinner.' },
    },
    partB: {
      a: {
        situation: 'Your health scare turns out to be minor, but the doctor tells you to slow down.',
        a: { text: 'Slow down.', fx: { health: 6, satisfaction: 5, seniority: -3 }, note: 'You change your habits.' },
        b: { text: 'Keep going.', fx: { seniority: 4, influence: 3, health: -6 }, note: 'The warning gets louder.' },
      },
      b: {
        situation: 'An old rival offers you a dream role abroad. Your loved ones would have to uproot.',
        a: { text: 'Take it.', fx: { seniority: 7, netWorth: 2000, relationships: -7 }, note: 'The world gets bigger, and your circle smaller.' },
        b: { text: 'Turn it down.', fx: { relationships: 5, satisfaction: 5 }, note: 'You know what you chose.' },
      },
    },
    result: {
      a: 'You built something big, and found out what it cost.',
      b: 'You chose people over position. You still had a good career.',
    },
  },
];

export const START_STATS: Stats = {
  satisfaction: 50, health: 60, relationships: 50, seniority: 10, influence: 10, netWorth: 40,
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Easy softens setbacks, Hard sharpens them. Gains are untouched.
function scale(fx: Fx, d: Difficulty): Fx {
  const k = d === 'Easy' ? 0.5 : d === 'Hard' ? 1.5 : 1;
  const out: Fx = {};
  (Object.keys(fx) as StatKey[]).forEach((s) => {
    const v = fx[s] as number;
    out[s] = v < 0 ? v * k : v;
  });
  return out;
}

export function applyFx(stats: Stats, fx: Fx, d: Difficulty): Stats {
  const f = scale(fx, d);
  const next = { ...stats };
  (Object.keys(f) as StatKey[]).forEach((s) => {
    const v = f[s] as number;
    next[s] = s === 'netWorth' ? Math.round(next[s] + v) : clamp(next[s] + v);
  });
  return next;
}

// Quick plays fewer, bigger episodes; Detailed plays all seven.
export function episodesFor(detail: Detail, startAge: number): Episode[] {
  const eligible = EPISODES.filter((e) => e.age >= startAge - 1);
  const list = eligible.length >= 3 ? eligible : EPISODES.slice(-3);
  return detail === 'Quick' ? list.filter((_, i) => i % 2 === 0 || i === list.length - 1) : list;
}

export function endingText(stats: Stats): { summary: string; epitaph: string } {
  const lines: string[] = [];
  lines.push(stats.satisfaction >= 60 ? 'You were mostly content.' : stats.satisfaction >= 40 ? 'You were neither unhappy nor fulfilled.' : 'You were rarely at peace.');
  lines.push(stats.relationships >= 60 ? 'The people around you stayed close.' : stats.relationships >= 40 ? 'You kept a handful of real friends.' : 'You drifted from most of the people you knew.');
  lines.push(stats.seniority + stats.influence >= 70 ? 'Your career carried real weight.' : 'Your work was solid but quiet.');
  lines.push(stats.netWorth >= 3000 ? 'You were comfortable.' : stats.netWorth >= 500 ? 'Money was never the main story.' : 'Money was always tight.');
  lines.push(stats.health >= 60 ? 'Your body held up.' : 'Your body paid for the pace.');
  const epitaph = stats.satisfaction >= 60 ? 'A life well lived.' : stats.seniority >= 40 ? 'Built a lot, felt little.' : 'It could have gone either way.';
  return { summary: lines.join(' '), epitaph };
}
