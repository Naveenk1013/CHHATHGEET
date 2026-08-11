# instructions.md — Chhath Pooja Microsite: Agent Build Guide

## 0. What this file is
This is the operating manual for the AI coding agent (running in Antigravity IDE) that will build this project. Read this file first, then `prd.md`, then `mvp.md`. Track all work in `progress.md`. Behavioral rules for *how* the agent should act while working live in `agentskill.md`.

**Reading order for the agent:**
1. `instructions.md` (this file) — how to work
2. `prd.md` — what we're building and why
3. `mvp.md` — what ships in v1, what doesn't
4. `agentskill.md` — persona, guardrails, checkpoint discipline
5. `progress.md` — current state; update after every task

---

## 1. Reference analysis (why we're doing it this way)
The reference site (Truck Wala / hornokplease.xyz) works because of a few disciplined choices. We are deliberately re-using this playbook:

| Reference site pattern | What we take from it |
|---|---|
| Single-page, single-purpose (no nav, no multi-page CMS) | Our site is also one scrolling page. No blog, no login. |
| One emotional hook stated immediately (hero headline + tagline) | Hero = festival name + one-line devotional tagline, above the fold. |
| Bilingual copy (Hindi headline, English subhead) | We mirror this: Devanagari for devotional/ritual language, English for explanatory text. |
| A single embedded media experience (YouTube iframe styled as a cassette player) | We embed a YouTube playlist of Chhath geet, styled as a diya/soop-themed player, not a generic embed. |
| Strong OG/Twitter meta tags, custom OG image | We ship the same meta discipline — this is a "shareable" site. |
| Minimal JS, no framework, fast load | Vanilla HTML/CSS/JS. No React/Vue/build step unless the agent hits a real limitation. |
| Distinct color/typographic identity (not generic Bootstrap look) | Sunrise/sunset palette + river motif, not generic "religious template" look. |
| Playful cultural in-jokes in copy (e.g. "buri nazar wale tera muh kaala") | We use *respectful* devotional phrasing instead — see Content Rules below, this is a religious festival, tone must stay warm and reverent, not jokey. |

**Key divergence from reference:** the reference site's tone is irreverent/nostalgic-fun. Ours is devotional/respectful. Do not carry over slang, jokes, or casual irreverence — Chhath Puja is a sacred fasting festival. Match the *structure*, not the *tone*.

---

## 2. Tech stack (decided)
- **Plain HTML5 + CSS3 + vanilla JavaScript.** No framework, no bundler, no npm build step for v1.
- One `index.html`, one `styles.css`, one `script.js`. Split further only if a single file exceeds ~400 lines.
- Fonts: a Devanagari-supporting font (e.g. Noto Sans Devanagari / Noto Serif Devanagari) for Hindi text, paired with a clean humanist sans (e.g. Inter / system-ui) for English. Load via `<link>` to Google Fonts or self-host — agent should ask user preference before adding an external font dependency if offline-first matters.
- Music/geet player: YouTube `<iframe>` embed (playlist mode), same technique as reference site — no need to reinvent an audio player.
- No backend, no database, no CMS for v1. Static site only.
- Deployment target: static hosting (GitHub Pages / Netlify / Vercel — ask user which one they'll use before wiring up any deploy config).
- Mobile-first CSS. Design at 375px width first, then scale up.

## 3. Folder structure
```
chhath-pooja-site/
├── index.html
├── /assets
│   ├── /images        (hero art, soop/diya/sun motifs, gallery photos)
│   ├── opengraph.jpg  (1200x630 social share image)
│   └── favicon files
├── /css
│   └── styles.css
├── /js
│   └── script.js
├── prd.md
├── mvp.md
├── instructions.md
├── agentskill.md
└── progress.md
```

## 4. Content sourcing rules (important — read carefully)
- The **only** authoritative definition of the festival to use verbatim/as the base is the one the user supplied:
  > छठ पूजा सूर्य देव और छठी मैया की उपासना का चार दिनों तक चलने वाला एक महान हिन्दू त्योहार है। यह मुख्य रूप से कार्तिक मास के शुक्ल पक्ष की षष्ठी को मनाया जाता है। इसमें कठोर अनुशासन, साफ-सफाई और शुचिता का विशेष ध्यान रखा जाता है।
- The agent **must not invent specific ritual instructions, mantras, timings, or regional claims** that aren't in the PRD's content spec or confirmed by the user. Chhath Puja practice varies by region/family (Bihar, UP, Jharkhand, Nepal Terai) — where the PRD lists the 4 standard day-names (Nahay Khay, Kharna, Sandhya Arghya, Usha Arghya), stick to describing *what each day is called and its general purpose*, not prescriptive how-to steps, unless the user provides that text.
- If unsure whether a cultural/religious detail is accurate, the agent should flag it in `progress.md` under "Needs user review" rather than guessing.
- Tone: warm, respectful, devotional. No jokes, no slang, no meme-speak.
- All user-facing devotional copy should be offered in **both Hindi and English**, Hindi first.

## 5. Non-functional requirements
- **Performance:** Lighthouse performance score ≥ 90 on mobile. Compress all images (WebP where possible). Lazy-load below-the-fold images.
- **Accessibility:** semantic HTML landmarks, alt text on every image (bilingual alt text where meaningful), sufficient color contrast (WCAG AA), keyboard-operable player controls.
- **SEO/share:** full meta description, OG tags, Twitter card, and a custom `opengraph.jpg`, mirroring the reference site's meta block structure.
- **Browser support:** last 2 versions of Chrome, Safari, Firefox, Edge; iOS Safari and Chrome Android specifically (this audience skews mobile).

## 6. Workflow discipline for the agent
1. Do not start writing code until `prd.md` and `mvp.md` are confirmed with the user.
2. Build in the checkpoint order defined in `progress.md`. Do not jump ahead to polish/animation before core sections exist.
3. After completing each checkpoint, update `progress.md` (status + short changelog line with date) before moving to the next.
4. Ask the user for real assets (YouTube playlist link, photos, exact festival dates for current year) rather than using placeholders permanently — placeholders are fine for a first pass but must be flagged in `progress.md`.
5. Keep commits/edits scoped to one checkpoint at a time so the user can review incrementally.
