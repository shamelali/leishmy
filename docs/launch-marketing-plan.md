# Leish! — Launch Marketing Plan

**Prepared:** 2026-08-04
**Owner:** Marketing Lead (to confirm) — **Review cadence:** weekly (Mon 10:00) + monthly deep-dive
**Status:** DRAFT v1.0 — aligned with `docs/financial-forecast.md` and `LAUNCH_READINESS_REPORT.md` (✅ ready for launch, 2026-08-03)
**Currency:** Malaysian Ringgit (RM)

---

## 1. Executive Summary

Leish! (leish.my) is Malaysia's beauty booking marketplace connecting clients with vetted makeup artists and studios. The product is launch-ready (build ✅, security ✅, payments ✅, email ✅, analytics wiring ✅). This plan turns that readiness into a **90-day go-to-market** that:

1. **Launches publicly in October 2026** — peak Malaysian wedding/event season (Oct–Dec), when demand for makeup artists spikes.
2. **Runs a 6-week pre-launch (mid-Aug – Sep)** to build a waitlist, seed social proof, and onboard supply (artists/studios) so the marketplace has inventory on day one.
3. **Drives both sides of the marketplace**: clients (demand) and artists/studios (supply) — supply is the critical path.
4. **Spends RM 96,000 over 90 days** across performance ads, influencers, events, and content, targeting the financial forecast's Year-1 revenue band (RM 180k–250k).

**North-star metric:** completed bookings per week. **Success targets at Day 90:** 2,000 waitlist → 1,500 registered clients, 60+ active artists/studios, 25–30 bookings/week at avg RM 250–350 (≈ RM 7,000–9,000 GMV/week), 2.5–3.5x blended ROAS on paid media.

---

## 2. Product & Positioning

### 2.1 What Leish! is (for the plan — single sentence each)

| Audience | Message |
|---|---|
| Clients | "Book Malaysia's top makeup artists & studios in minutes — real-time availability, instant confirmation, secure payment." |
| Artists/Studios | "Get booked, get paid. Your portfolio, your pricing, zero admin — we handle bookings, reminders, and payments." |

### 2.2 Positioning statement

> For beauty clients in Kuala Lumpur & Selangor who are tired of DM-ing artists and waiting days for a quote, Leish! is the booking platform that shows real-time availability, verified portfolios, and instant booking with secure payment — so you get the artist you want, for the date you need, without the back-and-forth.

### 2.3 Brand platform

- **Tagline (site):** "Your Beauty, Perfected." / "Book Beauty. Anywhere."
- **Launch campaign theme:** **"Never DM for a date again."** (client side) + **"Get booked. Get paid."** (artist side)
- **Tone:** warm, confident, aspirational — not luxury-exclusive; premium feel, accessible price.
- **Visual identity:** rose→pink→purple gradient, serif headlines, soft editorial photography (existing site design system — reuse across all assets).
- **Categories to lead with (8):** Bridal, Event, Hijab, Editorial, Airbrush, SFX, Hair, Lash — **Bridal + Hijab + Event** are the launch hero categories (highest demand, best avg booking value).

### 2.4 What the product already supports (leverage in campaigns)

- Instant booking + Billplz secure payment (FPX/cards)
- Real-time artist availability & reviews
- Artist & studio profiles with portfolios (Cloudinary)
- Rewards program + **Leish+ subscription (≈ RM29/mo)** — upsell lever post-launch
- Events page (`/events`) + Inspiration page (`/inspiration`) — SEO/content assets
- WhatsApp Business API wired into booking/cancellation/payment flows
- Brevo transactional + marketing email (`hello@leish.my`), GA4 + Meta Pixel already installed
- Artist dashboard with shareable profile links (`/dashboard/artist/share`) — built-in viral/recruitment tool

---

## 3. Market Context & Competitive Landscape

### 3.1 Market signals (planning assumptions — validate with local data during pre-launch)

- Malaysia's wedding/beauty-services demand peaks **Oct–Dec** (year-end wedding season) and around festive periods (Chinese New Year, Hari Raya). Launch timing exploits this.
- Beauty service booking in Malaysia is fragmented: most bookings happen via **Instagram DMs, WhatsApp, and Facebook bridal groups**. There is no dominant online booking platform for makeup artists — the "DM dance" is the incumbent competitor.
- Adjacent players: spa/wellness aggregators (e.g., TreatMe), deals platforms (e.g., Fave), wedding directories (e.g., MyWedding). **None own real-time MUA booking** — that is Leish!'s wedge.
- Avg booking value RM 250–350 (financial forecast). Bridal packages are the premium segment (RM 500–2,000+).

### 3.2 Our wedge

| Competitor behavior | Leish! response |
|---|---|
| DM/WhatsApp quote-chasing (informal) | Real-time availability + instant confirmation |
| No verified portfolios | Vetted profiles, reviews, portfolio-first design |
| Cash/deposit uncertainty | Secure Billplz payment, structured deposits, auto reminders |
| No marketplace liquidity | Both-side launch: recruit artists first, then drive demand |

---

## 4. Goals & KPIs

### 4.1 90-day targets (official launch Day 0 = early Oct 2026)

| KPI | Pre-launch (T-6wk→T-1wk) | Launch day | Day 30 | Day 60 | Day 90 |
|---|---|---|---|---|---|
| Waitlist / registered clients | 2,000 waitlist | 300 sign-ups in week 1 | 600 | 1,000 | **1,500** |
| Active artists & studios (bookable) | 30 | 40 | 50 | 55 | **60+** |
| Weekly bookings | — | 5 | 12 | 20 | **25–30** |
| Weekly GMV | — | RM 1,500 | RM 3,500 | RM 6,000 | **RM 7,000–9,000** |
| Commission revenue (20%) / wk | — | RM 300 | RM 700 | RM 1,200 | **RM 1,500–1,800** |
| Blended paid ROAS | — | — | ≥2.0x | ≥2.5x | **2.5–3.5x** |
| Client CAC (paid) | — | — | ≤RM 30 | ≤RM 25 | **≤RM 20** |
| Artist CAC (concierge) | — | — | ≤RM 60 | ≤RM 50 | **≤RM 40** |
| Email list | 2,500 | 3,000 | 4,000 | 5,000 | **6,000** |
| Social following (IG+TT+FB) | 3,000 | 4,000 | 6,000 | 8,000 | **10,000** |

### 4.2 Guardrail metrics (watch weekly)

- Supply/demand balance: artists with zero bookings in 14 days (react with demand campaigns or artist coaching)
- Booking no-show / cancellation rate (<15%)
- Artist response time (<4 hrs — the instant-booking promise)
- Page load + checkout funnel conversion (target: search→booking ≥2%)

---

## 5. Target Audiences

### 5.1 Demand side (clients)

| Persona | Who | Where they live online | Trigger moment | Offer |
|---|---|---|---|---|
| **Aina, the Bride** (27–35) | Getting married Oct–Dec 2026 / 2027, KL-Selangor | Instagram, bridal FB groups, Pinterest, TikTok, wedding expos | Engagement → booking MUA (4–8 wks before wedding) | Bridal trial-day package, "book & save RM100" |
| **Farah, the Event-Goer** (22–32) | Dinner events, grad, corporate functions, Raya/CNY gatherings | TikTok, Instagram Reels, WhatsApp groups | Event invitation received | RM30 off first booking code |
| **Hijab community** (20–35) | Hijab/bridal styling, modest-event makeup | IG/TikTok hijab MUA content, FB groups | Wedding/event of friend or family | Dedicated hijab artist directory + RM30 off |
| **Corporate HR/events teams** | Event planners, hotels, brands needing bulk MUAs | LinkedIn/email, Google | Roadshows, fashion shows, shoots | B2B corporate packages (15–20% commission model) |

### 5.2 Supply side (artists & studios) — critical path

| Persona | Who | Pain point | Leish! answer |
|---|---|---|---|
| **Solo MUA** (2–10 yrs exp) | 25–40, IG portfolio, books via DM | DM chaos, ghosting, no deposits, late payments | Free 3-month pro listing, instant payments, reminders, shareable profile link |
| **Studio owner** (1–5 artists) | Small salon/studio in KL/Selangor | Underutilized slots, no online booking | Studio profile + team booking, 15% commission, featured placement |
| **Hijab/bridal specialists** | Niche experts | Hard to stand out on IG | Category spotlight (Bridal/Hijab), "Featured Artist" launch program |

---

## 6. Launch Phases & Timeline

**Anchor dates (suggested — confirm with founder):**
- **T-8 (Aug 10):** Internal green-light, asset production starts
- **T-6 (Aug 24):** Pre-launch begins — waitlist + artist recruitment + teaser content
- **T-1 (Sep 28):** Press kit out, influencers post teasers, countdown
- **T-0 / Day 0 (Oct 5, Monday):** **Official public launch** — "Never DM for a date again" campaign + launch event + press
- **Day 30 (Nov 4):** Post-launch optimization, first referral wave, wedding-season push
- **Day 60 (Dec 4):** Festive/CNY booking push, B2B corporate push
- **Day 90 (Jan 4, 2027):** Review vs targets, plan Q1'27

### 6.1 Phase 0 — Pre-launch (Aug 10 – Oct 4): "The Waitlist"

**Goal:** 2,000 waitlist signups + 30 bookable artists before Day 0.

- [ ] Launch **waitlist landing** (email capture on homepage hero + /artists) with promise: *"Early members get RM30 off their first booking + priority access."*
- [ ] Recruit **30 anchor artists/studios** via concierge onboarding (one-on-one WhatsApp + setup help) — use the existing `/onboarding` flow + shareable profile link.
- [ ] Artist incentive: **free 3-month Pro listing** (normally RM200–500/mo) + 0% commission for first 10 bookings (vs standard 20%).
- [ ] **Teaser social campaign**: countdown reels, "spot the artist" portfolio carousels, founder-story posts. 3x/week IG+TT.
- [ ] Seed **social proof**: collect 10 early testimonials from beta users (testimonials section already on homepage).
- [ ] Stand up **GA4 conversions + Meta Pixel** events: `waitlist_signup`, `artist_application_started`, `search`, `booking_started`, `booking_completed` (env vars exist — verify in deployment checklist).
- [ ] Set up **Brevo** welcome sequence (waitlist → launch-day email) + UTM scheme (Appendix C).

### 6.2 Phase 1 — Launch Week (Oct 5 – 11): "Never DM for a Date Again"

**Goal:** 300 sign-ups, 40 bookable artists, first 5–10 bookings, earned media coverage.

- **Launch event (Oct 5–9):** Pop-up "glam bar" / media + influencer preview in KL (venue TBD — target Cyberjaya/KL; budget RM 6k). Invite: 10–15 KOLs, 20 artists, 5 press.
- **Influencer wave 1:** 8–12 micro KOLs (20k–150k followers, beauty/hijab/bridal niche) post launch week; each gets a unique code.
- **Paid media ON** (Meta + Google): search terms (bridal makeup KL, MUA near me, makeup artist booking, hijab makeup) + Meta interest stacks (bridal, beauty, KL/Selangor 20–40).
- **PR:** press release + pitch to SAYS, The Star, Malay Mail, NST, Lifestyle Asia, Selangor Journal, local wedding blogs. Story angle: *"Malaysian startup kills the MUA DM-chase; real-time booking for the wedding season."*
- **Launch promo:** `LEISH30` — RM30 off first booking (valid 30 days), artist side: 3-month free Pro + 0% first-10-bookings commission.

### 6.3 Phase 2 — Post-Launch Growth (Oct 12 – Dec 31): "Wedding Season"

**Goal:** 25 bookings/wk, 60 artists, 6,000 email list, ROAS 2.5x+.

- **Influencer wave 2 (Nov):** 4–6 mid-tier KOLs + real client UGC (before/after, "booked via Leish!").
- **Referral program live:** refer-a-friend → both get RM20 credit (Day 30).
- **Wedding expo presence:** book 1–2 expos (e.g., Malaysia Wedding Festival, KL) — lead-gen with QR + RM30 offer.
- **Hijab community push (Nov):** Ramadan/CNY prep content + hijab artist directory campaign.
- **B2B corporate (Dec):** pitch event planners/agencies for year-end functions, shoots, roadshows.
- **Content engine:** 2 blogs/mo (bridal MUA cost guide, hijab makeup trends, "how to choose your MUA") targeting SEO; reuse on /inspiration + /events pages.
- **Retention:** booking reminders (already automated), post-booking review request, rewards program comms, **Leish+ (RM29/mo) pilot** to top 100 clients (Day 60+).

### 6.4 Phase 3 — Review & Q1'27 Plan (Jan 2027)

- Score vs Day-90 targets; build cohort/LTV analysis; decide on Leish+ public rollout, expansion cities (Penang/JB), and seed-round marketing asks (per financial forecast RM 1.2M raise).

---

## 7. Channel Plan

### 7.1 Owned channels (zero/low cost — foundation)

| Channel | Role | Cadence |
|---|---|---|
| Instagram | Brand + portfolio showcase + promos | 4–5 posts/wk + 10 stories/wk + 2 reels/wk |
| TikTok | Reach event-goers + brides 20–35; UGC-style reels | 3–4/wk |
| Facebook + Groups | Bridal/beauty groups (KL Selangor brides, hijab MUAs); group value posts (not spam) | 3/wk + group participation daily |
| Email (Brevo) | Lifecycle: waitlist→launch, welcome, promo, re-engagement | Sequence + 2 newsletters/mo |
| WhatsApp (API) | Booking confirmations/reminders (exists), opt-in promo broadcasts | Automated + monthly broadcast |
| Blog / SEO | /inspiration + /events + category landing pages; "best MUA in KL" type guides | 2/mo |
| Artist share links | Every artist is an acquisition channel for clients | Always-on (product feature) |

### 7.2 Paid media (RM 47,000 of the 90-day budget)

| Channel | Budget | Objective | Notes |
|---|---|---|---|
| Meta (IG+FB) | RM 24,000 | Sign-ups + bookings | Interest stacks: bridal, weddings, makeup, hijab, KL/Selangor; retargeting pool ≥ 2% of budget |
| Google (Search + PMax) | RM 12,000 | High-intent bookings | Bridal MUA, event makeup, "makeup artist near me"; bid on brand + category |
| TikTok Ads | RM 6,000 | Awareness + UGC | Spark Ads on creator content, 18–35 KL/Selangor |
| Retargeting (Meta) | RM 5,000 | Funnel close | Site visitors, cart/waitlist abandoners, RM30 offer creative |

### 7.3 Earned & community (RM 43,000 incl. influencer fees)

| Channel | Budget | Tactic |
|---|---|---|
| Micro/mid KOLs (2 waves) | RM 24,000 | 16–18 creators; mix of flat fee + booking-code commission (10% of GMV) |
| Wedding expos / pop-ups | RM 12,000 | 1–2 expos + launch pop-up |
| PR / media | RM 3,000 (misc) | Press release, media kit, coffee-meetups with beauty journalists |
| Community seeding | RM 4,000 | Giveaways in bridal FB groups, university campus pop-ups (Cyberjaya: MMU, Limkokwing, UPM area) |

### 7.4 Artist-side (supply) acquisition — budget RM 6,000

| Tactic | Detail |
|---|---|
| Concierge onboarding | 1 staff, 20 artist setups/wk via WhatsApp; use artist share-link feature |
| "Switch from DM chaos" creative | Meta ads targeting working MUAs (interests: makeup artist, freelance MUA, bridal makeup) — 3-month free Pro + 0% first 10 bookings |
| Referral among artists | Referring artist gets RM100 + featured slot when referee completes 5 bookings |
| Community | Join/contribute to MUA FB/WhatsApp communities; host 1 free "grow your MUA business" webinar (Nov) |

---

## 8. Launch Offers & Promotions (lock before Day 0)

| Offer | Audience | Mechanics | Cap | Expiry |
|---|---|---|---|---|
| `LEISH30` — RM30 off first booking | All new clients | Code at checkout | First 300 redemptions | Day 30 |
| Early-bird waitlist bonus | Waitlist members | RM30 + priority access | — | Day 7 |
| Free 3-month Pro listing | New artists | Automatic on approval | 50 artists | Day 90 |
| 0% commission first 10 bookings | New artists | Automatic | 30 artists | Day 90 |
| Refer-a-friend RM20/RM20 | Clients | Code per user | — | Always-on from Day 30 |
| Artist referral RM100 + featured slot | Artists | On referee's 5th booking | — | Day 90 |

*All offers need a promo-code/discount system — verify support in admin dashboard before launch; if codes aren't supported, use manual UTM + support-issued credits, and log this as a pre-launch dev task.*

---

## 9. Content Calendar — First 12 Weeks (highlights; full calendar to be built from this)

**Content pillars (60/25/15):** Proof & results (before/afters, client stories) / Education & trends (cost guides, hijab looks, bridal timelines) / Brand & community (founder stories, artist spotlights, culture).

| Week | Theme | Hero content | Campaign |
|---|---|---|---|
| W1 (Aug 10) | Tease | Founder story reel: "Why we built Leish!" | Waitlist open |
| W2 | Artist spotlight #1 | "Meet the artist" carousel x3 | Artist recruitment |
| W3 | Pain-point comedy | "POV: DM-ing 15 MUAs for your wedding date" | Waitlist |
| W4 | Education | Reel: bridal makeup cost guide KL 2026 | Waitlist |
| W5 | Proof | Beta client before/after + testimonial | Waitlist |
| W6 | Countdown | "Leish! launches Oct 5" countdown series | Launch hype |
| W7 | **LAUNCH WEEK** | Launch event content, KOL posts, RM30 code | **Day 0** |
| W8 | Social proof | UGC roundup + first bookings | Post-launch |
| W9 | Hijab series | Hijab MUA directory + looks | Community push |
| W10 | Wedding season | "Book your wedding MUA now" urgency | Paid push |
| W11 | Referrals | Refer-a-friend launch creative | Referral |
| W12 | Festive prep | CNY/Raya early-bird booking | Festive |

**Evergreen SEO articles (publish 2/mo, drive /inspiration + /events):** "Best Bridal Makeup Artists in KL & Selangor 2026", "How Much Does Bridal Makeup Cost in Malaysia?", "Hijab Makeup Looks for Weddings", "Event Makeup Packages for Corporate Functions", "How to Choose a Makeup Artist: 10 Questions to Ask".

---

## 10. Budget Summary (90 days, official launch onward)

| Line | Amount (RM) | Share |
|---|---|---|
| Meta ads (incl. retargeting) | 29,000 | 30% |
| Google ads | 12,000 | 13% |
| TikTok ads | 6,000 | 6% |
| Influencers/KOLs (2 waves) | 24,000 | 25% |
| Events (launch pop-up + expos) | 12,000 | 13% |
| PR & media kit | 3,000 | 3% |
| Artist acquisition (ads + webinar) | 6,000 | 6% |
| Community/campus seeding | 4,000 | 4% |
| **Total** | **96,000** | 100% |

**Payback logic (vs financial forecast):** at blended CAC RM20/client and 2nd-booking repeat rate ≥30%, client LTV ≈ RM 90–150 (2–3 bookings avg RM 300 × 20% commission). CAC payback ≈ 1–2 bookings. Budget is sized for a *growth test*, not a burn — kill/scale by ROAS weekly.

---

## 11. Measurement & Analytics

### 11.1 Event tracking to verify (GA4 + Meta — env vars exist in repo)

- `waitlist_signup`, `sign_up`, `search`, `view_artist`, `booking_started`, `booking_completed` (value = booking value), `payment_success`, `artist_application_started`, `share_link_clicked`
- Set GA4 key events + Meta CAPI where possible; conversion = booking_completed.

### 11.2 Attribution

- UTM scheme on all outbound links (Appendix C); source/campaign/medium recorded in user signup (add hidden field at registration — dev task).
- Weekly report: bookings by channel, CAC by channel, artist acquisition by source, waitlist→signup→booking funnel.

### 11.3 Weekly dashboard (single sheet, updated every Monday)

| Section | Metrics |
|---|---|
| Growth | Waitlist, signups, active artists, bookings, GMV, commission revenue |
| Funnel | Search→artist view→booking_start→booking_complete conversion, checkout drop-off |
| Paid | Spend, ROAS, CAC, CPM/CPC by channel |
| Quality | No-show rate, cancellation rate, avg rating, repeat booking rate |
| Content | Email list size, open/click, social reach, top posts |

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Not enough artists at launch (empty marketplace) | Med | High | Concierge recruitment starts T-6; 30-artist gate before official launch; if <30, delay Day 0 by 1–2 wks (soft launch) |
| Supply floods but demand lags (artists churn) | Med | High | Weekly artist "zero bookings" check; demand-side ads + featured artist rotation; commission-free period keeps them |
| Promo abuse (RM30 codes) | Med | Low | One code per account (verify at signup), cap 300 redemptions, fraud flag on repeat emails |
| KOL performance below expectation | Med | Med | 60/40 flat+commission model; test 4 KOLs in wave 1 before committing wave 2 budget |
| Checkout friction (Billplz) drops funnel | Med | High | Monitor booking_started→completed; A/B deposit vs full payment; WhatsApp assist |
| Wedding-season competitor discounting | Low | Med | Compete on instant booking + reviews, not price; keep RM30 offer but lead with reliability messaging |
| SEO ramp too slow | High | Low | Content engine from Day 1; treat SEO as 6-month play; rely on paid+social for launch |
| Rate limiting / infra issues during spike | Low | High | Launch-readiness report ✅; load-test /artists + /bookings pages; UPSTASH Redis in prod (from checklist) |

---

## 13. Owner Matrix — 30-Day Launch Checklist

**Marketing owner** (hire/assign by Aug 10 — this is the #1 dependency):

| # | Task | Owner | Due |
|---|---|---|---|
| 1 | Confirm launch date + sign-off on plan | Founder | Aug 10 |
| 2 | Hire/assign marketing lead + content creator | Founder | Aug 17 |
| 3 | Waitlist page live + RM30 offer configured | Dev | Aug 24 |
| 4 | GA4 + Meta events verified (all 10 events) | Dev/Analytics | Aug 24 |
| 5 | Brevo sequences + UTM scheme live | Marketing | Aug 31 |
| 6 | 30 anchor artists recruited | Marketing/Concierge | Sep 28 |
| 7 | Media kit + press release drafted | Marketing | Sep 21 |
| 8 | KOL wave 1 contracted (8–12) | Marketing | Sep 21 |
| 9 | Launch pop-up venue + invite list | Marketing | Sep 21 |
| 10 | Paid campaigns live (Meta + Google) | Marketing | Sep 28 (test) → Oct 5 (full) |
| 11 | **Day 0 — official launch** | All | **Oct 5** |
| 12 | Weekly KPI dashboard running | Marketing | Oct 12 (first report) |
| 13 | Referral program live | Dev + Marketing | Nov 4 |
| 14 | Wedding expo booked (if not already) | Marketing | Nov 4 |
| 15 | Day-30 review vs targets | Founder + Marketing | Nov 4 |
| 16 | Leish+ pilot to top clients | Product | Dec 4 |
| 17 | Day-90 review + Q1'27 plan | Founder + Marketing | Jan 4, 2027 |

---

## 14. Open Questions for Founder (blockers to close by Aug 10)

1. **Confirm launch date** — Oct 5, 2026 proposed (first Monday after Hari Malaysia week; wedding season).
2. **Budget sign-off** — RM 96,000/90 days (drawn from seed runway per financial forecast).
3. **Promo-code system** — does the admin dashboard support codes/credits, or is a dev task needed before Aug 24?
4. **Social handles + brand assets** — Instagram/TikTok/Facebook handles, logo kit, press photos (Cloudinary images available).
5. **Marketing owner** — who owns execution (in-house hire vs agency vs founder-led with this plan as ops doc)?
6. **Leish+ timing** — keep RM29/mo subscription pilot internal for 90 days (recommended), public in Q1'27?
7. **Legal/compliance** — PDPA consent on waitlist capture + contest T&Cs before any giveaway.

---

## Appendix A — Asset Checklist (produce by Sep 21)

- [ ] Logo kit + brand gradients (from site) — PNG/SVG
- [ ] Hero/before-after photo bank (from Cloudinary/Unsplash assets + real bookings)
- [ ] 10 testimonial cards (from beta users)
- [ ] Media kit PDF (facts, founder bio, imagery, contact)
- [ ] Press release (2 versions: launch + artist-recruitment angle)
- [ ] Ad creative: 6 static + 4 reels (Meta), 4 search ads + 4 RSA (Google), 4 TikTok Spark Ads
- [ ] Email templates: waitlist welcome, launch-day, RM30 reminder, referral, artist win-back
- [ ] UTM link builder sheet (Appendix C)
- [ ] Launch-event deck + invitation + photo moment (backdrop with hashtag #BookBeautyAnywhere)

## Appendix B — Suggested Social Handles & Hashtags

- Handles: `@leish.my` (IG/TikTok/FB) — confirm availability; fallback `@leishmy`
- Campaign hashtags: `#BookBeautyAnywhere` (brand), `#LeishLaunch` (event), `#NeverDMForADate` (campaign), plus category tags: `#BridalMUA #HijabMakeup #KLMUA`

## Appendix C — UTM Scheme

```
Source: instagram / facebook / tiktok / google / email / whatsapp / expo / referral / artist_share / influencer_<name>
Medium: social / cpc / email / whatsapp / event / referral / share
Campaign: waitlist / launch / wedding_season / hijab_push / b2b / festive / artist_recruitment / referral / leishplus
Term: adset or keyword (for paid)
Content: creative name or KOL handle
```

Example: `https://leish.my/artists?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_content=kol_ainas_beauty`

---

*Alignment note: targets in §4 are consistent with `docs/financial-forecast.md` (RM 180–250k Y1 revenue, avg booking RM 250–350, 20% commission). Any change to launch date shifts phases in §6 but not the mechanics.*
