# mvp.md — Chhath Pooja Microsite: MVP Scope

## Goal of the MVP
Ship a single, fast-loading, shareable web page that captures the devotional spirit of Chhath Puja — what it is, its 4-day arc, and its geet (songs) — in the same lean single-page format as the reference site, launch-ready for the current Chhath season.

---

## In scope for v1 (build these, in this order)

### 1. Hero section
- Festival name in large Devanagari type: **छठ पूजा**, with English subtitle "Chhath Puja."
- One-line devotional tagline (Hindi + English), e.g. built from the user's definition — not the full paragraph, a condensed hook.
- Background: sunrise/river-adjacent visual motif (illustration or photo), not literal stock-photo clutter.
- A single primary CTA: scroll cue or "Suno छठी मैया के गीत" (Listen) that jumps to the player section.

### 2. "What is Chhath Puja" section
- Full definition text, presented bilingually (Hindi as given by user; a faithful English translation alongside).
- Short supporting line on *why* it matters (surya dev + chhathi maiya worship, discipline/purity) — pulled directly from the user-supplied definition, not invented.

### 3. Four-day timeline section
- Four cards/steps, one per day of the festival:
  1. **Nahay Khay** (नहाय खाय)
  2. **Kharna** (खरना)
  3. **Sandhya Arghya** (संध्या अर्घ्य)
  4. **Usha Arghya** (उषा अर्घ्य)
- Each card: name (Hindi + English), a 1–2 line general-purpose description (no invented step-by-step ritual instructions unless supplied by user), simple icon/motif (sun, water, soop/bamboo tray, diya).
- This section should read like a respectful overview, not a how-to guide.

### 4. Geet / music player section
- YouTube playlist embed (iframe), styled consistently with the site's visual identity — mirrors the reference site's "cassette player" trick but themed to Chhath (e.g. framed like a diya, soop, or brass thali rather than a cassette).
- Placeholder playlist link until the user provides the real YouTube playlist URL — flag this in `progress.md`.
- Basic play/pause affordance; graceful "needs JavaScript" fallback text, same pattern as reference site.

### 5. Gallery / visual motif strip (optional-but-cheap)
- A simple row/grid of festival imagery — soop, diya, sun, river ghat — either illustrated or licensed/user-provided photos. Skip if no imagery is available in time; do not use random unlicensed stock photos.

### 6. Footer
- Short credit line, year, and a respectful closing line (e.g. "छठी मैया की जय" style closing — confirm wording with user before finalizing, do not invent devotional phrasing casually).
- Social share meta tags wired up (OG/Twitter) even though there's no visible footer "share" button — sharing happens via link/OG preview, same as reference site.

---

## Explicitly out of scope for v1
- Multi-page site / navigation menu
- CMS or admin panel to edit content
- User accounts, comments, or any form of login
- E-commerce / donations / puja-samagri ordering
- Multi-language support beyond Hindi + English
- Push notifications / date reminders (could be a v2 "add to calendar" feature)
- Live-streaming of arghya ceremonies
- Region-specific ritual variation content (Bihar vs UP vs Nepal Terai) — v1 stays general/pan-regional
- Native mobile app

## Nice-to-have if time allows (v1.1, not blocking launch)
- "Add to calendar" button with the current year's Chhath dates (Nahay Khay → Usha Arghya)
- Sunrise/sunset time widget for Usha Arghya / Sandhya Arghya (based on user location, if they opt in)
- Dark/warm "diya mode" toggle for evening viewing

## Definition of done for MVP
- All 6 in-scope sections built, responsive from 375px–1440px+
- Lighthouse mobile performance ≥ 90
- Real (or clearly-flagged placeholder) YouTube playlist wired in
- OG/social preview tested (shows correct title/image/description when link is shared)
- Content reviewed against Section 4 of `instructions.md` (no invented ritual claims)
