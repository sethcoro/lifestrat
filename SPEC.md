# LifeStrat — Product Spec (v0.1)

Plain-English spec for an iPhone life-simulation game. Working title: **LifeStrat**.

## 1. What it is

A minimalist, black-and-white, chat-style game. You start at an age you pick. Each turn an AI describes a situation and gives you two options, A or B. You pick one, see the consequence, and the story moves on. Everything you choose carries forward. After a fixed number of turns, the AI writes a short summary of the life you lived and shows a stat card.

- Life stages: grade school, college, career. No kids' content. App is 17+.
- It's a game about choices, not a prediction of real life.

## 2. Settings (chosen on the Start screen)

| Setting | Options | What it does |
|---|---|---|
| Starting age | Player-chosen (e.g. 8, 14, 18, 22) | Sets the life stage the story begins in. |
| Detail level | Quick / Detailed | Quick = major life decisions only. Detailed = everyday choices too. |
| Difficulty | Easy / Medium / Hard | How punishing the world is. |

**Difficulty**
- Easy: good choices reliably pay off; setbacks are mild.
- Medium: a realistic mix, with some luck.
- Hard: consequences compound, and some outcomes are outside your control.

**Run length (episodes):** a run is **7 episodes, max 15 turns total**. Each episode is one scenario told in 2 linked parts (Part A, then Part B, where B follows from your answer to A). After Part B, the game shows a one- or two-sentence result of the episode. Episodes can jump forward in time. One episode may have a single part if the story calls for it (keeps the total at or under 15). A fixed structure keeps AI cost per run predictable. Detail level changes how big the episodes are (Quick = major life events, Detailed = everyday ones), not how many there are.

Detail level and difficulty are independent. Each is a short, swappable block of instructions sent to the AI every turn.

## 3. Stats

Six stats. Unlike the original brief, they are **visible during play** as simple text meters (no icons, no color).

1. **Satisfaction** — how happy and fulfilled you are
2. **Net worth** — money and assets (can be negative)
3. **Seniority** — how far you've risen in school or career
4. **Influence** — how much sway you have over people and events
5. **Health** — physical and mental wellbeing
6. **Relationships** — strength of your closeness to family, friends and partners

Each turn the AI returns the *changes* to the stats (e.g. satisfaction −5). The app applies them, clamps values to sensible ranges, and shows the meters. The AI proposes; the app is the only thing that actually changes the numbers.

## 4. The five screens

Design rules: pure black and white, one typeface, no images or icons, chat-thread layout. Light and dark modes are the same design with colors inverted.

1. **Start** — pick starting age, detail level and difficulty. Includes the 17+ age gate and analytics consent opt-in.
2. **Choice** — the situation text, the stat meters, and two big buttons: A and B. A small "Report" button flags bad AI output.
3. **Consequence** — the result of your pick is appended to the thread, then the next choice appears below it. The thread scrolls like a chat.
4. **Ending** — a narrative summary of the whole life, plus a screenshot-friendly stat card (final stats, starting settings, a one-line epitaph). Buttons: share, play again.
5. **Settings** — account, privacy (including analytics opt-out), restore purchases, delete account, support email, privacy policy link.

## 5. The life file

The hardest part of the design. It's a running record sent to the AI every turn so it never contradicts earlier decisions.

**What it holds**
- **Identity:** current age, life stage, name (optional)
- **Education:** school or college, major, grades, notable events
- **Career:** job, employer, level, income, history
- **Relationships:** family, friends, partner, key people (with names and status)
- **Money:** net worth, debts, major purchases
- **Health:** conditions, habits
- **Key choices:** a short list of the important past decisions and what happened
- **Open threads:** things set up that should pay off later (a pending exam, a rivalry, a loan)

**How it works**
1. Each turn the app sends the AI: the system prompt, the difficulty block, the detail-level block, the current life file, and the last few turns of story.
2. The AI replies with JSON only:
   ```json
   {
     "situation": "text shown to the player",
     "choice_a": "short text",
     "choice_b": "short text",
     "stat_changes": {"satisfaction": 0, "net_worth": 0, "seniority": 0,
                      "influence": 0, "health": 0, "relationships": 0},
     "life_file_updates": {"career": "...", "key_choices": ["..."]}
   }
   ```
3. The app checks the JSON is valid. If not, it retries once, then falls back to a safe response.
4. The app merges `life_file_updates` into the life file and saves it.

**Keeping it small:** the life file is kept short and summarized as it grows (old details get condensed; key choices and open threads are always preserved). This controls both cost and consistency.

**Higher-level questions:** occasionally the AI asks values questions ("Do you care about school?"). Those answers are recorded in the life file and influence later outcomes.

## 6. The ending

After the final turn, a stronger AI model gets the full life file and writes:
- a short narrative of the life (a few paragraphs, fitting the stats)
- an epitaph line
- the final stat card

Most turns use a cheaper model; only the ending uses the stronger one.

## 7. Content guardrails

- No content involving children or kids' scenarios; the app is 17+.
- Sensitive topics (death, illness, self-harm, abuse) are handled with restraint: no graphic detail, never presented as a choice to pursue self-harm. Fiction, not instruction.
- Every choice screen has a Report button.
- If the AI output fails validation or a safety check, the app swaps in a neutral fallback situation.

## 8. Data and privacy

- **Operational database:** accounts and saved runs, tied to the user.
- **Analytics database:** separate, de-identified, opt-in only. It stores starting age, detail level, difficulty, coded A/B choices, life stage and final stats under a random ID with no link to the account. No free text is ever collected.
- Honest claim: this shows how people play a game, not how they live.
- In-app account deletion, privacy policy and support email on a website.

## 9. Build order (from the brief)

1. Setup: accounts and tools
2. **Terminal prototype of the game engine** (play 30+ turns, tune prompts, difficulty blocks and ending)
3. App shell with fake data (Expo / React Native)
4. Real AI via a Supabase Edge Function (API key never in the app)
5. Accounts, saved runs, endings
6. Analytics and RevenueCat payments
7. TestFlight, then App Review

## 10. Open questions for later

- Exact turn counts and how many in-game years each turn covers
- Pricing model and free-run allowance
- Whether health/relationships are visible as bars or as plain numbers
- Which Claude models to use for turns versus endings, once costs are measured
