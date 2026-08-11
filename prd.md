# prd.md — Product Requirements Document
## Project: Chhath Pooja Microsite (working title: "छठ पूजा")

---

## 1. Overview
A single-page, bilingual (Hindi/English) devotional microsite dedicated entirely to **Chhath Puja**, the four-day festival of Surya Dev and Chhathi Maiya worship. The site follows the structural playbook of the reference project `hornokplease.xyz` (Truck Wala) — one focused page, one strong emotional/cultural hook, an embedded music experience, minimal tech overhead, and strong social-share presentation — but reframed in a respectful, devotional tone appropriate to a sacred fasting festival.

## 2. Objective
Give devotees, diaspora Bihari/Purvanchali/Nepali families, and culturally curious visitors a warm, fast, mobile-friendly single destination that:
1. Explains what Chhath Puja is and why it's observed.
2. Walks through its four ritual days at a high level.
3. Lets visitors listen to traditional Chhath geet.
4. Is attractive enough to be shared as a link during the festival season (WhatsApp/Instagram/Twitter previews).

## 3. Target audience
- Diaspora Indians/Nepalis (Bihar, Jharkhand, Uttar Pradesh, Terai region) living outside their hometowns during the festival.
- Devotees looking for a quick, respectful refresher on the festival's structure.
- Culturally curious general visitors (colleagues, friends, partners of devotees) who want a simple explainer.
- Skews mobile, skews shared-via-chat-app rather than found-via-search (though basic SEO still matters).

## 4. Goals
- Ship a fast (<2s load on 4G), mobile-first, single-page site.
- Communicate the festival's meaning accurately using the user-supplied definition as the source of truth.
- Provide an emotionally resonant audio experience (Chhath geet) as the centerpiece interaction, mirroring the reference site's music-first approach.
- Be shareable — correct, attractive OG/Twitter card previews.

## 5. Non-goals
- Not a full religious/educational encyclopedia of Chhath Puja (no exhaustive ritual manual, no vrat-vidhi step-by-step, no regional-variation deep dive).
- Not a community/social platform.
- Not a commerce site (no puja samagri sales, no donation processing) for v1.
- Not multi-page/multi-topic — stays single-purpose like the reference site.

## 6. Reference-site analysis (design/structural inputs)
`hornokplease.xyz` ("Truck Wala") is a single-page site with:
- A short, punchy Hindi/English title pairing in the hero.
- A single-purpose embedded YouTube playlist styled as a custom media player (cassette aesthetic), not a bare iframe.
- Minimal chrome: no nav bar, no multi-page structure, no footer clutter.
- Strong meta/OG/Twitter card setup with a dedicated 1200x630 OG image, theme-color meta tag, canonical URL.
- A distinct color identity (`#0a4a50` teal-ish theme color) rather than generic template colors.
- Bilingual copy throughout, Hindi-forward.
- A graceful `<noscript>`-style fallback message ("This one needs JavaScript…") for the player.

We are adopting: single-page structure, bilingual copy, custom-styled embedded player, full meta/OG discipline, distinct color identity, JS-fallback messaging.
We are **not** adopting: irreverent/slangy tone, truck/highway visual motifs (replaced with sunrise/river/soop/diya motifs), casual "inside joke" phrasing.

## 7. Features & user stories

| # | User story | Priority |
|---|---|---|
| 1 | As a visitor, I land on the page and immediately understand this is about Chhath Puja, in both Hindi and English. | P0 |
| 2 | As a visitor, I can read a short, accurate description of what Chhath Puja is and who/what it honors. | P0 |
| 3 | As a visitor, I can see the four days of the festival named and briefly explained, in order. | P0 |
| 4 | As a visitor, I can play traditional Chhath geet directly on the page without leaving it. | P0 |
| 5 | As a visitor sharing this link on WhatsApp/Instagram, the link preview shows an attractive custom image, title, and description. | P0 |
| 6 | As a visitor on a slow mobile connection, the page loads quickly and doesn't jank. | P0 |
| 7 | As a visitor, I see festival-appropriate imagery (soop, diya, sun, ghat) that reinforces the mood. | P1 |
| 8 | As a returning visitor next year, I can see this year's exact festival dates (v1.1 — add to calendar). | P2 |
| 9 | As a visitor, I can toggle a warm "evening/diya" visual mode. | P2 |

## 8. Content requirements
- **Source definition (authoritative, Hindi):**
  > छठ पूजा सूर्य देव और छठी मैया की उपासना का चार दिनों तक चलने वाला एक महान हिन्दू त्योहार है। यह मुख्य रूप से कार्तिक मास के शुक्ल पक्ष की षष्ठी को मनाया जाता है। इसमें कठोर अनुशासन, साफ-सफाई और शुचिता का विशेष ध्यान रखा जाता है।
- **English rendering (to pair alongside, for the site):**
  > Chhath Puja is a great Hindu festival, observed over four days, dedicated to the worship of Surya Dev (the Sun God) and Chhathi Maiya. It is primarily celebrated on Shashthi (the sixth day) of the bright fortnight (Shukla Paksha) of the Kartik month. It calls for strict discipline, cleanliness, and purity.
- **Four-day names** (Hindi + English, to be used exactly): Nahay Khay / नहाय खाय, Kharna / खरना, Sandhya Arghya / संध्या अर्घ्य, Usha Arghya / उषा अर्घ्य. One to two neutral, general-purpose sentences per day — no prescriptive ritual instructions unless the user supplies exact wording.
- **Geet/music:** requires a real YouTube playlist URL from the user before launch; placeholder allowed during build, must be flagged in `progress.md`.
- **Imagery:** either commissioned/illustrated motifs or user-provided/licensed photography. No random unlicensed stock imagery of religious ceremonies.

## 9. Design & branding direction
- **Palette:** sunrise/sunset warm tones (marigold orange, deep gold) paired with a calm river-blue or dusk-teal base — analogous to the reference site's single strong theme-color choice, but shifted from industrial teal to devotional warm/gold.
- **Typography:** Devanagari-supporting serif or sans (e.g. Noto Serif Devanagari for headings, Noto Sans Devanagari for body) paired with a clean English sans (e.g. Inter).
- **Motifs:** soop (bamboo winnowing tray), diya, sun disc, river/ghat silhouette — used sparingly as iconography/section dividers, not as heavy decoration that slows load time.
- **Tone of voice:** warm, respectful, calm. No slang, no jokes, no meme culture — this is the key tonal divergence from the reference site.

## 10. Technical requirements
- Static HTML/CSS/vanilla JS (see `instructions.md` §2 for full stack decision).
- Mobile-first responsive layout, 375px → 1440px+.
- Full meta tag suite: title, meta description, canonical, OG (title/description/image/type/locale/site_name), Twitter card, theme-color.
- Custom 1200x630 `opengraph.jpg`.
- Lighthouse mobile performance ≥ 90, accessibility ≥ 90.
- No backend/database for v1.

## 11. Success metrics (informal — this is a passion/cultural project, not a tracked SaaS product)
- Page loads correctly and fast on mobile during the festival week.
- Link preview renders correctly when shared on WhatsApp/Instagram/Twitter.
- Positive qualitative feedback from people it's shared with (family/community).
- No inaccurate or disrespectful content reported.

## 12. Risks & assumptions
- **Risk:** inventing ritual details not confirmed by the user could be culturally inaccurate or disrespectful — mitigated by the content sourcing rule in `instructions.md` §4.
- **Risk:** no real YouTube playlist ready at build time — mitigated by placeholder + flag in `progress.md`.
- **Assumption:** user will supply or approve final devotional closing lines, exact day-by-day descriptions, and imagery before public launch.
- **Assumption:** festival dates change every year (lunar calendar) — any displayed date must be for the current year and clearly sourced/verified, not hardcoded blindly into future years.

## 13. Rough build sequence (maps to `progress.md`)
1. Project scaffold + meta/SEO shell
2. Hero section
3. "What is Chhath Puja" section
4. Four-day timeline section
5. Geet/music player section
6. Gallery/visual motif strip
7. Footer + final meta/OG polish
8. Performance + accessibility pass
9. Content accuracy review with user
10. Launch
