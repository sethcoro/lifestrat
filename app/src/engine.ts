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

export interface Opt { text: string; note: string; fx: Fx }
export interface Step { situation: string; options: Opt[]; hint?: string }
// Life episode: part A, then a part B that depends on which A option was picked.
export interface Episode { title: string; age: number; a: Step; b: Step[]; result: string[] }
export interface Situation {
  id: string;
  title: string;
  blurb: string;
  start: Partial<Stats>;
  steps: Step[];
  twist: { text: string; fx: Fx }; // Hard only
}

const o = (text: string, note: string, fx: Fx): Opt => ({ text, note, fx });
const st = (situation: string, options: Opt[], hint?: string): Step => ({ situation, options, hint });

// ---------------------------------------------------------------------------
// Fixed life episodes
// ---------------------------------------------------------------------------
const QUIZ: Episode = {
  title: 'The quiz', age: 14,
  a: st("Sunday night. You have an algebra quiz tomorrow worth 20% of your grade and haven't opened the book. Your best friend Dani texts: \"new game just dropped, come over.\"", [
    o('Stay home and study.', 'You study. Dani sulks a little.', { seniority: 5, satisfaction: -3 }),
    o("Go to Dani's and wing it.", 'Best night in weeks.', { satisfaction: 8, relationships: 6 }),
  ]),
  b: [
    st('You ace the quiz. Dani jokes that you have gone soft and invites you again on Friday, a school night.', [
      o('Go anyway.', 'You are back in the group chat.', { relationships: 5, seniority: -2 }),
      o('Stay disciplined.', 'Dani goes quiet for a few days.', { seniority: 4, relationships: -3 }),
    ]),
    st('The quiz comes back: 62%. Mr. Okafor offers to replace it if you give up your lunches for two weeks.', [
      o('Give up your lunches.', 'Your grade becomes an 88%.', { seniority: 9, relationships: -3, satisfaction: -3 }),
      o('Keep your lunch table.', 'The 62% stays.', { relationships: 4, seniority: -4 }),
    ]),
  ],
  result: [
    'You put school first and it showed. Teachers started to notice you.',
    'You learned what a bad night costs, and what it takes to climb back.',
  ],
};

const BISCUIT: Episode = {
  title: 'Biscuit', age: 14,
  a: st('Your neighbor offers $20 a week to walk her beagle, Biscuit. The same hour is math club.', [
    o('Join math club.', 'You meet people who like numbers.', { seniority: 4, influence: 3 }),
    o('Walk Biscuit for $20.', 'Four weeks, four twenties.', { netWorth: 80, health: 3, influence: 2 }),
  ]),
  b: [
    st("The club enters a regional contest. It is the same weekend as a friend's birthday.", [
      o('Compete.', 'You place third.', { seniority: 5, influence: 3, relationships: -3 }),
      o('Go to the party.', 'The team finds a replacement.', { relationships: 6, satisfaction: 4 }),
    ]),
    st("Mrs. Alvarez offers $60 for a full weekend of dog-sitting. It is the same Saturday as Dani's first birthday party.", [
      o('Take the $60.', 'Dani is hurt.', { netWorth: 60, relationships: -6 }),
      o("Go to Dani's party.", 'You were there.', { relationships: 7, satisfaction: 5 }),
    ]),
  ],
  result: [
    'You became part of something, even if the pay was zero.',
    'You learned what your time is worth, and who you spend it on.',
  ],
};

const ROOMMATE: Episode = {
  title: 'The roommate', age: 19,
  a: st('Your roommate Sam parties every weekend and wants you in. Midterms start in ten days.', [
    o('Join the parties.', 'You have never met so many people.', { satisfaction: 6, relationships: 5, health: -4, seniority: -3, netWorth: -400 }),
    o('Hold the line and study.', 'The room is quiet and so are you.', { seniority: 5, relationships: -3 }),
  ]),
  b: [
    st('Sam has a fake-ID idea that could get you both into the best clubs in town.', [
      o('Do it.', 'You got in, and got a $300 campus fine.', { satisfaction: 4, influence: 2, health: -3, netWorth: -300 }),
      o('Pass.', 'Sam rolls his eyes.', { relationships: -2, seniority: 2 }),
    ]),
    st('Sam is struggling with his classes and asks you to help him cram. It costs your study time.', [
      o('Help Sam.', 'He passes, and he owes you.', { relationships: 6, seniority: -2 }),
      o('Say no.', 'He fails the exam.', { seniority: 3, relationships: -5 }),
    ]),
  ],
  result: [
    'College gave you a social life, and you paid for it with sleep and cash.',
    'You were disciplined, and a little lonely about it.',
  ],
};

const INTERNSHIP: Episode = {
  title: 'The internship', age: 21,
  a: st('Two summer internships: a prestigious but unpaid one at a big firm, or a paid job at a small startup.', [
    o('Prestigious and unpaid.', 'Good name on the resume, a $4,000 hole in your savings.', { seniority: 6, influence: 4, netWorth: -4000 }),
    o('Paid at the startup.', 'You earn $6,000 and do real work from day one.', { netWorth: 6000, influence: 2 }),
  ]),
  b: [
    st('A senior manager offers to be your mentor, but only if you work through the holiday weekend.', [
      o('Accept.', 'He gives you a name to drop.', { seniority: 5, influence: 4, relationships: -3 }),
      o('Take the weekend off.', 'He seems unimpressed.', { satisfaction: 4, health: 3 }),
    ]),
    st("The startup's founder offers you a small equity stake instead of a $3,000 raise.", [
      o('Take the equity.', 'You are now a tiny owner.', { influence: 4, seniority: 3 }),
      o('Take the raise.', 'Safe, steady money.', { netWorth: 3000, seniority: 1 }),
    ]),
  ],
  result: [
    'You invested in your future instead of your bank account.',
    'You earned while you learned, and kept your options open.',
  ],
};

const LONG_VIEW: Episode = {
  title: 'The long view', age: 30,
  a: st('You have a decent life, but a quiet question keeps coming back: what is all of this for?', [
    o('Chase the next promotion.', 'A $12,000 raise, and a lot of late nights.', { seniority: 6, influence: 4, health: -4, satisfaction: -2, netWorth: 12000 }),
    o('Invest in the people you love.', 'You are home for dinner.', { relationships: 8, satisfaction: 6, seniority: -2 }),
  ]),
  b: [
    st('A health scare turns out to be minor, but the doctor tells you to slow down.', [
      o('Slow down.', 'You change your habits.', { health: 6, satisfaction: 5, seniority: -3 }),
      o('Keep going.', 'The warning gets louder.', { seniority: 4, influence: 3, health: -6, netWorth: 8000 }),
    ]),
    st('An old rival offers you a dream role abroad. Your loved ones would have to uproot.', [
      o('Take it.', 'A $40,000 bump. The world gets bigger, and your circle smaller.', { seniority: 7, netWorth: 40000, relationships: -7 }),
      o('Turn it down.', 'You know what you chose.', { relationships: 5, satisfaction: 5 }),
    ]),
  ],
  result: [
    'You built something big, and found out what it cost.',
    'You chose people over position. You still had a good career.',
  ],
};

// ---------------------------------------------------------------------------
// Random-pool inflection points: shown with 6-8 options, each with its own path
// ---------------------------------------------------------------------------
interface Path { name: string; note: string; fx: Fx; next: Step; result: string }

const PATHS: Path[] = [
  { name: 'State university', note: 'Four years, about $24,000 in loans.', fx: { netWorth: -24000, seniority: 6, relationships: 3 },
    next: st('Sophomore year, time to declare a major.', [
      o('A practical field.', 'Solid prospects, less joy.', { seniority: 4, satisfaction: -2, netWorth: 6000 }),
      o('Follow your passion.', 'You love it, and the job market does not.', { satisfaction: 5, netWorth: -2000 }),
    ]),
    result: 'A degree, a debt, and a decent start.' },
  { name: 'Elite university', note: 'A famous name, and about $68,000 in loans.', fx: { netWorth: -68000, influence: 8, seniority: 8, health: -3 },
    next: st('An opportunity: research with a famous professor, or an eager startup club.', [
      o('Research.', 'You publish as an undergraduate.', { seniority: 6, influence: 3 }),
      o('Startup club.', 'You meet your future cofounder.', { influence: 6, netWorth: -2000, relationships: 3 }),
    ]),
    result: 'You bought a network, and you are still paying for it.' },
  { name: 'Community college, then transfer', note: 'Two cheap years, about $9,000 in costs.', fx: { netWorth: -9000, health: 2, satisfaction: 2 },
    next: st('Your grades are strong enough to transfer to a good state school.', [
      o('Transfer.', 'You finish with a degree and little debt.', { seniority: 6, netWorth: -8000 }),
      o('Keep working full time.', 'You earn, and learn slower.', { netWorth: 9000, seniority: 1, health: -2 }),
    ]),
    result: 'You took the slow, cheap road, and it held.' },
  { name: 'Trade school or apprenticeship', note: 'You earn while you learn, about $5,000 ahead.', fx: { netWorth: 5000, health: -2, seniority: 3 },
    next: st('Your mentor offers to sponsor an advanced certification.', [
      o('Get the certification.', 'Your hourly rate jumps.', { seniority: 5, netWorth: -1500 }),
      o('Start working full time.', 'Money now, a ceiling later.', { netWorth: 8000 }),
    ]),
    result: 'You learned a skill people always need.' },
  { name: 'Join the military', note: 'About $8,000 saved, a harder daily life.', fx: { netWorth: 8000, health: 4, relationships: -4, seniority: 4 },
    next: st('Your enlistment is ending. They offer a $12,000 bonus to stay.', [
      o('Re-enlist.', 'More pay, more years.', { netWorth: 12000, health: -3, relationships: -2 }),
      o('Leave and use the GI Bill.', 'A free degree and a fresh start.', { seniority: 5, netWorth: 2000 }),
    ]),
    result: 'You learned discipline, and what home means.' },
  { name: 'Take a gap year and work', note: 'About $11,000 saved in a year.', fx: { netWorth: 11000, satisfaction: 5 },
    next: st('The year is up. Your friends are all in college.', [
      o('Travel with your savings.', 'Seven thousand dollars, one great story.', { netWorth: -7000, satisfaction: 6 }),
      o('Start college with a cushion.', 'You show up focused.', { seniority: 3, relationships: -1 }),
    ]),
    result: 'You gave yourself time, and it paid off in focus.' },
  { name: 'Start a business at 18', note: 'You put $7,000 of your own money in.', fx: { netWorth: -7000, influence: 4, satisfaction: 3 },
    next: st('Your first product gets 40 orders and one angry review.', [
      o('Double down.', 'You spend another $3,000 on ads.', { netWorth: -3000, influence: 4 }),
      o('Pivot to services.', 'Less glamorous, but it pays.', { netWorth: 4000, seniority: 2 }),
    ]),
    result: 'You learned that building is harder, and better, than planning.' },
];

const CAREERS: Path[] = [
  { name: 'Software engineer', note: 'About $38,000 saved over two years.', fx: { netWorth: 38000, health: -2, seniority: 4 },
    next: st('A team lead role opens. You could manage people or stay an individual contributor.', [
      o('Manage people.', 'A raise, a calendar full of meetings.', { seniority: 6, relationships: -2, netWorth: 8000 }),
      o('Stay technical.', 'You get to keep building.', { satisfaction: 4, netWorth: 12000 }),
    ]),
    result: 'You wrote the systems other people depended on.' },
  { name: 'Nurse', note: 'About $24,000 saved. Meaningful and exhausting.', fx: { netWorth: 24000, health: -3, satisfaction: 4 },
    next: st('The hospital offers night-shift pay of $9,000 extra a year.', [
      o('Work nights.', 'More money, less sleep.', { netWorth: 9000, health: -6 }),
      o('Stay on days.', 'You see your friends.', { relationships: 4 }),
    ]),
    result: 'You were there for strangers on their worst days.' },
  { name: 'Teacher', note: 'About $9,000 saved. Low pay, high meaning.', fx: { netWorth: 9000, satisfaction: 6, relationships: 3 },
    next: st('The school offers a $3,000 stipend to coach, or a raise for a graduate degree.', [
      o('Coach the team.', 'Kids remember you.', { netWorth: 3000, satisfaction: 3, health: -2 }),
      o('Get the degree.', 'A $9,000 cost now, a higher pay scale later.', { netWorth: -9000, seniority: 5 }),
    ]),
    result: 'You shaped people you will never fully meet again.' },
  { name: 'Electrician', note: 'About $27,000 saved. Steady and in demand.', fx: { netWorth: 27000, health: -1, seniority: 3 },
    next: st('After years in the union, a friend urges you to start your own contracting business.', [
      o('Start the business.', 'An $8,000 start-up cost and a lot more risk.', { netWorth: -8000, influence: 5, seniority: 4 }),
      o('Stay with the union.', 'Benefits and predictability.', { netWorth: 9000, satisfaction: 2 }),
    ]),
    result: 'You kept the lights on, literally.' },
  { name: 'Sales representative', note: 'About $21,000 saved, and it swings month to month.', fx: { netWorth: 21000, influence: 3, health: -1 },
    next: st('You can close a huge deal by overselling what the product does.', [
      o('Close it.', 'A $14,000 commission and a knot in your stomach.', { netWorth: 14000, satisfaction: -4, influence: 2 }),
      o('Walk away.', 'You keep your integrity and lose the deal.', { relationships: 3, satisfaction: 3, netWorth: -2000 }),
    ]),
    result: 'You learned that people buy people.' },
  { name: 'Finance analyst', note: 'About $34,000 saved, with long hours.', fx: { netWorth: 34000, health: -5, seniority: 5 },
    next: st('A big deal means 80-hour weeks for two months.', [
      o('Grind it out.', 'A $14,000 bonus, and a tired body.', { netWorth: 14000, health: -7, seniority: 4 }),
      o('Set boundaries.', 'You stay healthy, and a step behind.', { health: 3, seniority: -1, netWorth: 4000 }),
    ]),
    result: 'You became fluent in money, and short on time.' },
  { name: 'Designer', note: 'About $7,000 saved. Creative and uncertain.', fx: { netWorth: 7000, satisfaction: 5, influence: 2 },
    next: st('An agency offers a steady job. Freelance clients keep calling too.', [
      o('Take the agency job.', 'A stable $10,000 more, less freedom.', { netWorth: 10000, satisfaction: -3 }),
      o('Go freelance.', 'Your name on the work.', { influence: 3, netWorth: -2000, satisfaction: 4 }),
    ]),
    result: 'You made things people actually looked at.' },
  { name: 'Chef', note: 'About $3,000 in the hole after long hours.', fx: { netWorth: -3000, satisfaction: 3, health: -3 },
    next: st('You can open a food truck ($25,000) or join a famous restaurant as sous chef.', [
      o('Open the food truck.', 'You put $25,000 on the line.', { netWorth: -25000, influence: 4, satisfaction: 4 }),
      o('Join the famous kitchen.', 'Low pay, high prestige.', { netWorth: 4000, seniority: 5 }),
    ]),
    result: 'You fed a lot of people, and learned what hard work tastes like.' },
  { name: 'Lawyer', note: 'About $55,000 of law school debt.', fx: { netWorth: -55000, seniority: 7, influence: 3 },
    next: st('A big firm offers top pay. A public defender office offers purpose.', [
      o('Big firm.', 'About $30,000 more, billable hours forever.', { netWorth: 30000, health: -6, influence: 3 }),
      o('Public defender.', 'You fight for people who have no one.', { satisfaction: 6, netWorth: 5000, health: -2 }),
    ]),
    result: 'You learned that the law is a tool, and who it serves depends on you.' },
  { name: 'Startup founder', note: 'About $18,000 of your own money in.', fx: { netWorth: -18000, influence: 5, satisfaction: 2 },
    next: st('An investor offers money for 20% of your company. You could also bootstrap.', [
      o('Raise the money.', 'A $3,000 legal bill and a board member.', { netWorth: -3000, seniority: 3, influence: 4 }),
      o('Bootstrap with a side job.', 'You keep control and your sleep suffers.', { netWorth: 6000, health: -4 }),
    ]),
    result: 'You built something from nothing, and it was never boring.' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fromPool(title: string, age: number, situation: string, pool: Path[], count: number): Episode {
  const picks = shuffle(pool).slice(0, count);
  return {
    title, age,
    a: st(situation, picks.map((p) => o(p.name, p.note, p.fx))),
    b: picks.map((p) => p.next),
    result: picks.map((p) => p.result),
  };
}

// Built fresh each run, so the options (and their order) differ every time.
const pathEpisode = () => fromPool('Your path', 17, 'School is ending and the future is open. There is no right answer, only costs. Where do you go?', PATHS, 6);
const careerEpisode = () => fromPool('Choosing a career', 24, 'You are ready to start earning for real. A few doors are open. Which one do you walk through?', CAREERS, 8);

export const START_AGES = [8, 14, 18, 22];

export function startStats(age: number): Stats {
  const money = age <= 8 ? 15 : age <= 14 ? 120 : age <= 18 ? 1500 : 6000;
  return { satisfaction: 50, health: 60, relationships: 50, seniority: 10, influence: 10, netWorth: money };
}

// Quick plays fewer, bigger episodes; Detailed plays all seven.
export function buildEpisodes(detail: Detail, startAge: number): Episode[] {
  const all = [QUIZ, BISCUIT, pathEpisode(), ROOMMATE, INTERNSHIP, careerEpisode(), LONG_VIEW];
  const eligible = all.filter((e) => e.age >= startAge - 1);
  const list = eligible.length >= 3 ? eligible : all.slice(-3);
  const bigForks = new Set(['Your path', 'Choosing a career']);
  return detail === 'Quick' ? list.filter((e, i) => i % 2 === 0 || i === list.length - 1 || bigForks.has(e.title)) : list;
}

// ---------------------------------------------------------------------------
// Situation simulator
// ---------------------------------------------------------------------------
export const SITUATIONS: Situation[] = [
  {
    id: 'crisis', title: 'Business crisis',
    blurb: 'Your biggest client just left and you have three months of cash.',
    start: { netWorth: 85000, seniority: 45, influence: 30, satisfaction: 45 },
    steps: [
      st('You run a 12-person company. Your largest client, 40% of revenue, just told you they are leaving. You have about three months of cash.', [
        o('Lay off three people now.', 'You save about $24,000 and lose the team\'s trust.', { netWorth: 24000, relationships: -8, satisfaction: -8, influence: -3 }),
        o('Ask everyone for a 20% pay cut for three months.', 'Most stay. A few quietly start looking.', { netWorth: 12000, relationships: -3, influence: 3, satisfaction: -2 }),
        o('Borrow $60,000 against your home.', 'Breathing room, with $6,000 of interest and a real risk.', { netWorth: -6000, seniority: 2, satisfaction: -4 }),
      ], 'Cutting people is fast, but it costs trust you will need later.'),
      st('A competitor offers to buy a 25% stake for $80,000. Or you could chase new clients hard.', [
        o('Sell the stake.', 'You give up value and get breathing room.', { netWorth: -10000, influence: -4, satisfaction: 3 }),
        o('Go after three smaller clients yourself.', 'Long days, but you land two.', { health: -6, influence: 5, netWorth: 15000 }),
      ], 'Selling equity cheaply in a panic is rarely a good deal.'),
      st('Your best salesperson just quit and took a client list with them.', [
        o('Sue.', 'Costs $20,000 and sends a message.', { netWorth: -20000, relationships: -4, influence: 2 }),
        o('Let them go and hire a replacement.', 'It costs $8,000 to recruit.', { netWorth: -8000, satisfaction: 2 }),
        o('Counter with a big raise.', 'They stay, and the rest of the team notices.', { netWorth: -14000, relationships: 5, influence: 3 }),
      ], 'Think about what the rest of the team is watching.'),
    ],
    twist: { text: 'Hard: your bank freezes your credit line. You lose $25,000 of working capital.', fx: { netWorth: -25000, satisfaction: -6 } },
  },
  {
    id: 'will', title: 'The inheritance',
    blurb: 'Your mother left the family house to three siblings who disagree.',
    start: { netWorth: 40000, relationships: 55, satisfaction: 45 },
    steps: [
      st('Mom left the house to you and your two siblings equally. Your brother wants to sell. Your sister wants to keep it. Your share would be about $110,000.', [
        o('Push to sell and split it.', 'You get your $110,000. Your sister stops speaking to you.', { netWorth: 110000, relationships: -10, satisfaction: -3 }),
        o('Offer to buy them both out with a mortgage.', 'Fees cost $4,000, but it keeps the house.', { netWorth: -4000, relationships: 2, satisfaction: 4 }),
        o('Hire a mediator.', 'It costs $3,000 and calms things down.', { netWorth: -3000, relationships: 5 }),
      ], 'Money and grief tangle together. Slower is often kinder.'),
      st('Your sister says you only care about the money. Your brother is quietly asking for a loan of $15,000.', [
        o('Lend him the $15,000.', 'He is grateful. You may not get it back.', { netWorth: -15000, relationships: 5 }),
        o('Say no, kindly.', 'He understands, mostly.', { relationships: -3, netWorth: 0 }),
        o('Lend $5,000 in writing, with terms.', 'It feels businesslike, but fair.', { netWorth: -5000, relationships: 1, influence: 2 }),
      ], 'A written agreement protects the relationship as much as the money.'),
      st('The house needs $20,000 in repairs before anyone can sell it or live in it.', [
        o('Split the cost three ways.', 'It is slow but fair.', { netWorth: -6700, relationships: 3 }),
        o('Pay it yourself and take a bigger share.', 'It speeds things up and stings your siblings.', { netWorth: -20000, relationships: -4, influence: 3 }),
        o('Sell as-is at a $15,000 discount.', 'It is done, and no one is happy.', { netWorth: -5000, satisfaction: 3 }),
      ], 'Fairness often matters more than speed.'),
    ],
    twist: { text: 'Hard: a distant relative contests the will. Legal fees hit.', fx: { netWorth: -12000, satisfaction: -5, relationships: -3 } },
  },
  {
    id: 'salary', title: 'Salary negotiation',
    blurb: 'A dream job offers $78k. The market says $90k.',
    start: { netWorth: 8000, seniority: 20, satisfaction: 50 },
    steps: [
      st('A company you love offers you $78,000. Your research says similar roles pay about $90,000.', [
        o('Accept immediately.', 'You are in, a little underpaid.', { netWorth: 3000, satisfaction: 3, seniority: 2 }),
        o('Counter at $92,000 with data.', 'They respect it, and push back.', { netWorth: 9000, influence: 3 }),
        o('Counter and hint at a competing offer you don\'t have.', 'It works, and it sits badly.', { netWorth: 11000, satisfaction: -3, influence: -2 }),
      ], 'Asking is expected. Lying is a different thing.'),
      st('They come back at $85,000 but remove the $5,000 signing bonus.', [
        o('Accept $85,000.', 'A good outcome, net of the bonus.', { netWorth: 2000, satisfaction: 3 }),
        o('Hold out for $90,000.', 'It is tense for two days.', { netWorth: 4000, influence: 2, satisfaction: -3 }),
        o('Ask for extra vacation and remote days instead.', 'More life, same money.', { satisfaction: 6, health: 2 }),
      ], 'Money is not the only thing you can negotiate.'),
      st('First week: your manager asks you to take on a big project with unpaid overtime.', [
        o('Say yes.', 'You impress people and burn some energy.', { seniority: 5, health: -4, influence: 3 }),
        o('Negotiate the scope.', 'You get a smaller, clearer version.', { influence: 2, seniority: 2 }),
        o('Decline politely.', 'You protect your time. It may cost you.', { satisfaction: 3, seniority: -2 }),
      ], 'Early habits become expectations.'),
    ],
    twist: { text: 'Hard: they cut the deadline to 24 hours and imply another candidate is ready.', fx: { satisfaction: -5, netWorth: -3000 } },
  },
  {
    id: 'move', title: 'The relocation',
    blurb: 'Your partner got a dream job in another country.',
    start: { netWorth: 30000, relationships: 65, satisfaction: 55 },
    steps: [
      st('Your partner has been offered a dream job two time zones away. You have a job you like and a mother nearby.', [
        o('Move together.', 'A new life, and a lot of uncertainty.', { relationships: 6, netWorth: -6000, satisfaction: 3, seniority: -3 }),
        o('Try long distance.', 'It is hard and possible.', { relationships: -2, netWorth: -3000, satisfaction: -2 }),
        o('Ask them to turn it down.', 'They do, and the resentment is quiet.', { relationships: -5, satisfaction: -3 }),
      ], 'Whoever gives up more should be seen and thanked for it.'),
      st('Three months in, the strain shows. Calls are shorter and you are both tired.', [
        o('Plan a visit and a serious talk.', 'It costs $2,000 and clears the air.', { netWorth: -2000, relationships: 6 }),
        o('Wait it out.', 'Things stay the same.', { relationships: -3 }),
        o('Set a deadline for a decision.', 'It is honest and scary.', { relationships: 2, satisfaction: -1 }),
      ], 'Silence is not neutral in a long-distance relationship.'),
      st('You each get a new offer, in different cities. It is time to decide what you are building.', [
        o('Choose the same city, even at a cost.', 'You trade career for stability.', { relationships: 7, seniority: -3, netWorth: -4000 }),
        o('Choose your careers separately.', 'You respect each other, and you keep paying for distance.', { seniority: 5, relationships: -5, netWorth: 6000 }),
      ], 'Both of you will remember who gave up what.'),
    ],
    twist: { text: 'Hard: a visa delay leaves you unable to work for four months.', fx: { netWorth: -9000, satisfaction: -6, relationships: -3 } },
  },
  {
    id: 'layoff', title: 'The layoff',
    blurb: 'You were laid off with 3 months of severance and a mortgage.',
    start: { netWorth: 35000, seniority: 50, satisfaction: 40 },
    steps: [
      st('You were laid off after eight years. Severance covers three months. The mortgage is $2,200 a month.', [
        o('Take the first job offered.', 'A $12,000 pay cut, but income starts now.', { netWorth: -3000, seniority: -5, satisfaction: -4 }),
        o('Spend three months job-hunting for the right role.', 'You burn $9,000 of savings.', { netWorth: -9000, seniority: 2, satisfaction: 1 }),
        o('Start freelancing.', 'Feast or famine.', { netWorth: -5000, influence: 3, health: -3 }),
      ], 'Savings buy time. The question is what you buy with it.'),
      st('Weeks go by. Your confidence takes a hit and an old friend offers to introduce you to a founder.', [
        o('Take the intro.', 'The meeting goes well.', { influence: 4, satisfaction: 4, relationships: 3 }),
        o('Keep applying online.', 'Silence, mostly.', { satisfaction: -4 }),
        o('Use the time to retrain.', 'A $4,000 course changes your options.', { netWorth: -4000, seniority: 4, satisfaction: 3 }),
      ], 'Most jobs come through people, not portals.'),
      st('A job offer arrives: stable, boring, and $5,000 less than before. Another is risky and exciting.', [
        o('Take the stable job.', 'Bills paid, spirit dented.', { netWorth: 8000, satisfaction: -2, seniority: 1 }),
        o('Take the risky one.', 'Equity, a long road.', { influence: 4, satisfaction: 4, netWorth: -2000, seniority: 5 }),
      ], 'After a shock, your tolerance for risk is lower than you think.'),
    ],
    twist: { text: 'Hard: your car dies and your health insurance lapses.', fx: { netWorth: -8000, health: -4, satisfaction: -4 } },
  },
  {
    id: 'care', title: 'The care decision',
    blurb: 'Your father can no longer live alone.',
    start: { netWorth: 55000, relationships: 55, health: 55 },
    steps: [
      st('Your father had a fall. He can no longer live alone. Assisted living costs $5,500 a month. Your sister lives far away.', [
        o('Move him into your home.', 'It saves $5,500 a month and costs you your time and sleep.', { netWorth: 6000, health: -6, relationships: -3, satisfaction: -3 }),
        o('Pay for assisted living.', 'It costs $33,000 over six months.', { netWorth: -33000, health: 2, relationships: 2 }),
        o('Hire a part-time caregiver.', 'A $14,000 middle path.', { netWorth: -14000, health: -2, relationships: 1 }),
      ], 'You cannot pour from an empty cup.'),
      st('Your sister says you are overreacting and offers to help only with advice.', [
        o('Ask her directly for money and a monthly visit.', 'It is uncomfortable and fair.', { relationships: 2, netWorth: 4000, satisfaction: 2 }),
        o('Say nothing and carry it.', 'You keep the peace and get worn out.', { relationships: -4, health: -4 }),
        o('Set a boundary and call a family meeting.', 'It is hard and it helps.', { relationships: 4, satisfaction: 3 }),
      ], 'Resentment grows quietly. Speak early.'),
      st('Dad has a good week and says he wants to stay in his own home, however risky.', [
        o('Respect his wishes with safety changes.', 'A $7,000 fix and more worry.', { netWorth: -7000, relationships: 5, satisfaction: 3 }),
        o('Override him for his safety.', 'He is safe and angry.', { relationships: -6, health: 2 }),
      ], 'Autonomy is part of dignity.'),
    ],
    twist: { text: 'Hard: a second medical emergency adds an unexpected $18,000 bill.', fx: { netWorth: -18000, health: -4, satisfaction: -4 } },
  },
  {
    id: 'audit', title: 'The audit',
    blurb: 'You find your boss inflating the numbers.',
    start: { netWorth: 22000, seniority: 35, influence: 20 },
    steps: [
      st('While preparing the quarterly report, you find that your boss has been moving revenue between quarters to hit targets. It looks like fraud.', [
        o('Report it internally.', 'HR thanks you and tells you to be careful.', { influence: 2, relationships: -3, satisfaction: 2 }),
        o('Go straight to the regulator.', 'It is the right thing and it is dangerous.', { influence: 4, relationships: -6, satisfaction: 3 }),
        o('Say nothing.', 'You keep your head down and your conscience heavy.', { satisfaction: -8, seniority: 2 }),
      ], 'Document everything before you decide.'),
      st('Your boss finds out someone asked questions and corners you in the hall.', [
        o('Tell the truth.', 'It gets tense, and you stay calm.', { influence: 3, relationships: -3 }),
        o('Deny everything.', 'He relaxes. You do not.', { satisfaction: -4, relationships: -2 }),
        o('Say you want to talk to a lawyer.', 'It costs you $1,500 and ends the conversation.', { netWorth: -1500, influence: 2, satisfaction: 2 }),
      ], 'Keep calm and keep records.'),
      st('The company launches an investigation. You may be asked to testify, and your job could be on the line.', [
        o('Testify openly.', 'You are laid off six months later with $20,000 severance.', { netWorth: 20000, influence: 6, satisfaction: 4, seniority: -4 }),
        o('Decline to participate.', 'You are safe and you know what you saw.', { satisfaction: -6, seniority: 2 }),
        o('Negotiate a confidential settlement.', 'A $45,000 payout and a quiet exit.', { netWorth: 45000, satisfaction: -2, influence: -2 }),
      ], 'Each option protects something different.'),
    ],
    twist: { text: 'Hard: your boss leaks a false rumor that you are the one under investigation.', fx: { relationships: -6, influence: -5, satisfaction: -5 } },
  },
  {
    id: 'pitch', title: 'The term sheet',
    blurb: 'An investor offers $1M, but the terms are steep.',
    start: { netWorth: 12000, influence: 25, seniority: 25 },
    steps: [
      st('After 18 months of building, an investor offers $1,000,000 for 35% of your company, plus a board seat. You have six weeks of runway.', [
        o('Accept the terms.', 'You are funded and diluted.', { netWorth: -2000, influence: 3, seniority: 4, satisfaction: 3 }),
        o('Negotiate to 25% and no board seat.', 'It takes two weeks. They agree to 28%.', { influence: 5, netWorth: -1000 }),
        o('Walk away and bootstrap.', 'You keep it all, and you run out of cash fast.', { netWorth: -9000, health: -5, satisfaction: -3 }),
      ], 'Runway is leverage for them. Time is expensive.'),
      st('After the deal, your cofounder wants to spend aggressively on growth. You want to be careful.', [
        o('Back your cofounder.', 'Growth is fast and the burn is faster.', { influence: 4, netWorth: -3000, health: -3 }),
        o('Insist on discipline.', 'You slow down and survive longer.', { influence: 2, relationships: -3, netWorth: 2000 }),
        o('Compromise on a phased plan.', 'A balance both of you can live with.', { relationships: 3, influence: 3 }),
      ], 'Disagreements between cofounders kill more companies than competitors.'),
      st('A large company offers to acquire you for $6M, of which your share would be $1.4M.', [
        o('Sell.', 'You cash out, and you wonder what was next.', { netWorth: 1400000, satisfaction: 5, influence: 3 }),
        o('Decline and keep building.', 'A bigger shot, a bigger risk.', { influence: 6, satisfaction: 2, netWorth: -4000 }),
      ], 'There is no wrong answer, only different regrets.'),
    ],
    twist: { text: 'Hard: the investor delays wiring the money by three weeks. You cover payroll yourself.', fx: { netWorth: -14000, health: -4, satisfaction: -5 } },
  },
];

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Easy softens setbacks, Hard sharpens them, and money gets luck on Medium and Hard.
function shape(fx: Fx, d: Difficulty): Fx {
  const k = d === 'Easy' ? 0.5 : d === 'Hard' ? 1.5 : 1;
  const out: Fx = {};
  (Object.keys(fx) as StatKey[]).forEach((s) => {
    let v = fx[s] as number;
    if (v < 0) v *= k;
    if (s === 'netWorth' && v !== 0 && d !== 'Easy') {
      const swing = d === 'Hard' ? 0.3 : 0.2;
      v *= 1 + (Math.random() * 2 - 1) * swing;
    }
    out[s] = v;
  });
  return out;
}

export function applyFx(stats: Stats, fx: Fx, d: Difficulty): Stats {
  const f = shape(fx, d);
  const next = { ...stats };
  (Object.keys(f) as StatKey[]).forEach((s) => {
    const v = f[s] as number;
    next[s] = s === 'netWorth' ? Math.round((next[s] + v) / 50) * 50 : clamp(next[s] + v);
  });
  return next;
}

export function fmtMoney(n: number): string {
  return `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
}

export function endingText(stats: Stats): { summary: string; epitaph: string } {
  const lines: string[] = [];
  lines.push(stats.satisfaction >= 60 ? 'You were mostly content.' : stats.satisfaction >= 40 ? 'You were neither unhappy nor fulfilled.' : 'You were rarely at peace.');
  lines.push(stats.relationships >= 60 ? 'The people around you stayed close.' : stats.relationships >= 40 ? 'You kept a handful of real friends.' : 'You drifted from most of the people you knew.');
  lines.push(stats.seniority + stats.influence >= 70 ? 'Your career carried real weight.' : 'Your work was solid but quiet.');
  lines.push(stats.netWorth >= 250000 ? 'You were comfortable.' : stats.netWorth >= 25000 ? 'You were stable.' : stats.netWorth >= 0 ? 'Money was always tight.' : 'You carried debt for most of your life.');
  lines.push(stats.health >= 60 ? 'Your body held up.' : 'Your body paid for the pace.');
  const epitaph = stats.satisfaction >= 60 ? 'A life well lived.' : stats.seniority >= 40 ? 'Built a lot, felt little.' : 'It could have gone either way.';
  return { summary: lines.join(' '), epitaph };
}

// Situation debrief: compare where you ended up to where you started.
export function debrief(start: Stats, end: Stats): { verdict: string; rows: { label: string; from: string; to: string; delta: number }[] } {
  const keys: StatKey[] = ['satisfaction', 'health', 'relationships', 'seniority', 'influence', 'netWorth'];
  const rows = keys.map((k) => ({
    label: STAT_LABELS[k],
    from: k === 'netWorth' ? fmtMoney(start[k]) : String(start[k]),
    to: k === 'netWorth' ? fmtMoney(end[k]) : String(end[k]),
    delta: end[k] - start[k],
  }));
  const people = keys.filter((k) => k !== 'netWorth').reduce((n, k) => n + (end[k] - start[k]), 0);
  const money = (end.netWorth - start.netWorth) / 5000;
  const score = people + Math.max(-20, Math.min(20, money));
  const verdict = score >= 12 ? 'You came out ahead.' : score >= 0 ? 'You came through it.' : score >= -12 ? 'It cost you.' : 'It cost you a lot.';
  return { verdict, rows };
}
