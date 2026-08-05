# Leish! — Comprehensive Business Plan

**Document Version:** 1.0
**Date:** August 2026
**Status:** Draft

---

## 1. Executive Summary

Leish! is a Malaysian online marketplace connecting customers with beauty and wellness service providers — artists (stylists, nail technicians, skincare specialists) and studios (salons, spas, clinics). The platform streamlines discovery, booking, and payment for beauty services across Malaysia.

The platform is built on Next.js 16 (App Router), uses Neon serverless Postgres with Drizzle ORM, integrates Billplz for payments, Brevo for transactional email, and Cloudinary for media storage. It is deployed on Vercel with Cloudflare infrastructure (CDN, email routing, Workers).

**Key Metrics (Target):**
- Monthly Active Users (MAU): 50,000 by Month 12
- Active Service Providers: 2,000 by Month 12
- Monthly Bookings: 15,000 by Month 12
- Gross Transaction Value (GTV): RM 5M/month by Month 12

---

## 2. Company Overview

### 2.1 Mission
Democratize access to beauty and wellness services in Malaysia by making discovery, booking, and payment seamless for both consumers and providers.

### 2.2 Vision
Become the leading beauty and wellness marketplace in Southeast Asia, starting with Malaysia.

### 2.3 Legal Structure
- Registered as a Malaysian Sdn Bhd (private limited company)
- Registered address: Kuala Lumpur, Malaysia
- Tax ID: [To be registered]

### 2.4 Founding Team
- **CEO / Founder** — Product strategy, business development, fundraising
- **CTO** — Technology architecture, engineering team leadership
- **COO** — Operations, provider onboarding, customer support
- **CMO** — Marketing, brand, growth

---

## 3. Market Analysis

### 3.1 Industry Overview
- The Malaysian beauty and wellness market is valued at approximately RM 8 billion (2025) and growing at 12-15% CAGR
- Post-pandemic, digital booking for beauty services has accelerated adoption
- Malaysia has 32+ million internet users with high smartphone penetration (75%+)
- The gig economy in beauty services is still fragmented — most providers operate independently without digital tools

### 3.2 Target Market Segments

| Segment | Description | Size Estimate |
|---------|-------------|---------------|
| **Urban Consumers (18-45)** | Tech-savvy Malaysians in KL, PJ, Penang, Johor seeking convenient booking | ~8M |
| **Beauty Artists** | Independent stylists, nail techs, aestheticians without a fixed salon | ~50,000+ |
| **Studios/Salons** | Small to medium salons and spas looking for digital presence and bookings | ~10,000+ |
| **Premium/Spa Clients** | High-income consumers seeking premium wellness experiences | ~2M |

### 3.3 Competitive Landscape

| Competitor | Strengths | Weaknesses |
|------------|-----------|------------|
| **Fresha** | Global brand, strong POS | Limited Malaysia presence, no local payment integration |
| **Booksy** | Large user base, AI recommendations | Not focused on Malaysian market |
| **Google Maps / Search** | Free, high traffic | No booking/payment integration, poor provider tools |
| **WhatsApp / Instagram** | Free, widely used | No structured booking, payment, or review system |
| **Local Facebook Groups** | Community trust | Unstructured, no payment, no verification |

### 3.4 Competitive Advantage
1. **Local-first payment integration** — Billplz supports Malaysian payment methods (FPX, credit card, e-wallet)
2. **Neon Auth** — Secure, modern authentication with session management
3. **Dashboard ecosystem** — Separate dashboards for admin, artists, and studios with role-based access
4. **Cron-driven automation** — Automated booking reminders, payment reconciliation, lead follow-ups
5. **Cloud-native infrastructure** — Serverless, scalable, low operational overhead

---

## 4. Value Proposition

### 4.1 For Customers
- **Discovery** — Browse artists and studios by location, service, price, and rating
- **Convenience** — Book services in minutes with real-time availability
- **Security** — Secure payment via Billplz, with escrow-like payment release
- **Transparency** — Clear pricing, reviews, and provider profiles
- **Rewards** — Loyalty program with points and cashback incentives

### 4.2 For Service Providers (Artists & Studios)
- **Client Acquisition** — Access to a steady stream of booked clients
- **Business Tools** — Calendar management, staff management, inventory tracking, financial analytics
- **Professional Presence** — Profile pages with portfolios, reviews, and ratings
- **Payment Processing** — Automated payment collection and settlement
- **Marketing** — Promotional tools, lead follow-up automation

### 4.3 For the Platform
- **Commission-based revenue** — Take a percentage of each transaction
- **Subscription revenue** — Premium plans for studios and artists
- **Advertising revenue** — Sponsored listings and promoted profiles
- **Data insights** — Aggregated market data for industry reports

---

## 5. Business Model

### 5.1 Revenue Streams

| Stream | Description | Target % of Revenue |
|--------|-------------|---------------------|
| **Transaction Commission** | 10-15% commission on each booking payment | 60% |
| **Subscription Plans** | Monthly/annual premium plans for studios and artists | 20% |
| **Advertising & Promotions** | Sponsored listings, banner ads, promoted profiles | 10% |
| **Lead Generation** | Paid lead packages for artists and studios | 5% |
| **Value-Added Services** | Insurance, equipment leasing, training partnerships | 5% |

### 5.2 Pricing Model

**Commission Structure:**
- Standard: 10% per booking
- Premium (subscribed providers): 8% per booking
- New provider incentive: 5% for first 3 months

**Subscription Tiers:**

| Tier | Price (RM/month) | Features |
|------|-------------------|----------|
| **Free** | RM 0 | Basic profile, 10 bookings/month |
| **Pro** | RM 99 | Unlimited bookings, analytics, calendar |
| **Business** | RM 299 | Multi-staff, inventory, priority support, marketing tools |
| **Enterprise** | Custom | White-label, API access, dedicated account manager |

### 5.3 Payment Flow
1. Customer books a service and pays via Billplz
2. Payment is held in escrow (Billplz escrow/pending)
3. Service is completed
4. Platform releases payment to provider (minus commission)
5. Provider settles to their bank account via FPX or transfer

---

## 6. Marketing Strategy

### 6.1 Go-to-Market Phases

**Phase 1: Launch (Months 1-3) — "Seed"**
- Onboard 100 artists and 20 studios in KL
- Targeted Instagram/TikTok campaigns
- Influencer partnerships with beauty bloggers
- Referral program: RM 20 credit for both referrer and referee
- Google Ads (search + display) targeting "beauty booking Malaysia"

**Phase 2: Growth (Months 4-8) — "Scale"**
- Expand to Penang, Johor, and Ipoh
- Launch artist/studio subscription plans
- Content marketing (beauty tips, provider spotlights)
- Email marketing campaigns (Brevo)
- PR and media coverage
- Partnership with beauty schools and training academies

**Phase 3: Expansion (Months 9-18) — "Dominate"**
- Expand to all major Malaysian cities
- Launch loyalty/rewards program
- Introduce corporate/team booking for events
- Explore cross-border expansion (Singapore, Indonesia)
- B2B partnerships with beauty product brands

### 6.2 Customer Acquisition Channels

| Channel | Strategy | Target CPA (RM) |
|---------|----------|-----------------|
| **Instagram/TikTok** | Reels, influencer collabs, paid ads | RM 15-25 |
| **Google Ads** | Search + Display, retargeting | RM 20-30 |
| **Referral Program** | RM 20 credit per successful referral | RM 10-15 |
| **Content Marketing** | SEO blog, YouTube tutorials | RM 5-10 |
| **Email Marketing** | Brevo campaigns, welcome sequences | RM 3-8 |
| **Partnerships** | Beauty schools, product brands | RM 10-20 |
| **WhatsApp Business** | Webhook-triggered notifications, broadcasts | RM 2-5 |

### 6.3 Retention Strategy
- Loyalty points system (earn per booking, redeem for discounts)
- Personalized recommendations based on booking history
- Automated booking reminders (cron jobs)
- Post-service follow-up and review requests
- Exclusive deals and early access for repeat customers
- Push notifications (PWA support)

---

## 7. Operations Plan

### 7.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS 4 |
| **Backend** | Next.js API Routes, Drizzle ORM |
| **Database** | Neon (serverless Postgres) |
| **Auth** | @neondatabase/auth (Neon Auth / Better Auth) |
| **Payments** | Billplz ( Malaysian payment gateway) |
| **Email** | Brevo (@getbrevo/brevo) |
| **Storage** | Cloudinary (images/media) |
| **CDN/Edge** | Cloudflare (Workers, KV, R2) |
| **Monitoring** | Sentry (error tracking, performance) |
| **Hosting** | Vercel |
| **Testing** | Playwright (E2E) |
| **CI/CD** | GitHub Actions (auto-deploy on push to main) |

### 7.2 Key Infrastructure Components

**Middleware (`src/proxy.ts`):**
- Dashboard auth protection
- Cookie-based redirect for public pages
- API rate limiting (Upstash Redis)
- CSP headers with nonce support

**Cron Jobs (Vercel Cron):**
- Sync auth users from Neon
- Sweep orphaned records
- Reconcile payments
- Auto-release payments after service completion
- Booking reminders (24h before)
- Second payment collection
- Lead follow-ups
- Inbound email acknowledgment
- Weekly digest emails

**Workers:**
- `workers/email/` — Standalone Cloudflare Worker for email processing
- `workers/url-shortener/` — URL shortening service

### 7.3 Provider Onboarding Process
1. Application submission (profile, portfolio, ID verification)
2. Review and approval (1-3 business days)
3. Profile setup (services, pricing, availability, location)
4. Payment account linking (Billplz)
5. First booking and orientation
6. Ongoing support and training

### 7.4 Customer Support
- In-app chat support
- WhatsApp Business webhook for inquiries
- Email support (Brevo)
- FAQ and help center
- Response time target: < 4 hours (business hours)

---

## 8. Financial Projections

### 8.1 Startup Costs (One-Time)

| Item | Cost (RM) |
|------|-----------|
| Company registration & legal | 5,000 |
| Brand identity & design | 10,000 |
| Initial development (6 months) | 150,000 |
| Marketing launch budget | 30,000 |
| Infrastructure setup | 10,000 |
| Miscellaneous | 5,000 |
| **Total** | **210,000** |

### 8.2 Monthly Operating Costs

| Item | Cost (RM) |
|------|-----------|
| Vercel hosting | 500 |
| Neon database | 1,000 |
| Cloudinary storage/bandwidth | 800 |
| Billplz transaction fees (~1.5% of GTV) | Variable |
| Brevo email | 200 |
| Cloudflare Workers/KV | 300 |
| Upstash Redis | 200 |
| Sentry | 150 |
| Marketing spend | 15,000 |
| Staff salaries (4 FTE) | 40,000 |
| Office/co-working | 2,000 |
| Miscellaneous | 1,000 |
| **Total** | **~61,150 + variable** |

### 8.3 Revenue Projections

| Month | Bookings (RM) | GTV | Commission (10%) | Subscriptions | Other | Total Revenue |
|-------|---------------|-----|-------------------|---------------|-------|---------------|
| M1 | 500 | 25,000 | 2,500 | 0 | 0 | 2,500 |
| M3 | 2,000 | 100,000 | 10,000 | 2,000 | 500 | 12,500 |
| M6 | 8,000 | 400,000 | 40,000 | 10,000 | 2,000 | 52,000 |
| M9 | 12,000 | 600,000 | 60,000 | 25,000 | 5,000 | 90,000 |
| M12 | 15,000 | 750,000 | 75,000 | 50,000 | 10,000 | 135,000 |

### 8.4 Break-Even Analysis
- Fixed monthly costs: ~RM 61,150
- Break-even commission revenue (at 10%): RM 611,500 GTV/month
- Projected to reach break-even by Month 10-12

### 8.5 Funding Requirements
- **Seed Round:** RM 500,000 (covers 18 months of operations + development)
- **Use of Funds:**
  - 40% Product development and engineering
  - 30% Marketing and user acquisition
  - 15% Operations and infrastructure
  - 10% Legal, admin, and compliance
  - 5% Contingency

---

## 9. Growth Strategy

### 9.1 Product Roadmap

**Q3 2026 (Current):**
- Launch MVP with core booking flow
- Onboard initial artists and studios in KL
- Basic search and filtering
- Payment integration with Billplz

**Q4 2026:**
- Mobile PWA optimization
- Review and rating system
- Loyalty points program
- Advanced search (location, price, availability)
- Admin dashboard enhancements

**Q1-Q2 2027:**
- Mobile native app (React Native or Flutter)
- AI-powered recommendations
- Multi-city expansion (Penang, Johor, Ipoh)
- Subscription plans for providers
- Corporate booking features

**Q3-Q4 2027:**
- Cross-border expansion (Singapore)
- B2B marketplace (product suppliers to providers)
- Insurance integration for providers
- API marketplace for third-party integrations
- Franchise/white-label offering

### 9.2 Key Growth Metrics
- **Customer Acquisition Cost (CAC):** Target < RM 25
- **Lifetime Value (LTV):** Target > RM 200
- **LTV:CAC Ratio:** Target > 8:1
- **Monthly Churn Rate:** Target < 5%
- **Net Promoter Score (NPS):** Target > 50

---

## 10. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Low initial provider supply** | High | High | Aggressive onboarding incentives, partnership with beauty schools |
| **Payment fraud / disputes** | Medium | High | Billplz escrow, KYC verification, fraud detection rules |
| **Competitor entry** | Medium | Medium | First-mover advantage, local payment integration, strong network effects |
| **Regulatory changes** | Low | Medium | Legal counsel, compliance monitoring, flexible business structure |
| **Technology failure** | Low | High | Multi-region Neon, Vercel edge, automated backups, Sentry monitoring |
| **Provider churn** | Medium | Medium | Subscription lock-in, analytics tools, marketing support |
| **Customer trust** | Medium | High | Verified profiles, secure payments, transparent reviews |
| **Cash flow gap** | Medium | High | Lean operations, milestone-based funding, revenue diversification |

---

## 11. Team & Organization

### 11.1 Current Team (4 FTE)
| Role | Responsibilities |
|------|-----------------|
| CEO / Founder | Strategy, fundraising, partnerships |
| CTO | Architecture, engineering, infrastructure |
| COO | Operations, onboarding, customer support |
| CMO | Marketing, growth, brand |

### 11.2 Hiring Plan

| Month | Role | Purpose |
|-------|------|---------|
| M3 | 2x Full-Stack Engineers | Scale product development |
| M4 | 1x Marketing Specialist | Execute growth campaigns |
| M6 | 1x Customer Support Agent | Handle growing user base |
| M9 | 1x Data Analyst | Growth analytics and optimization |
| M12 | 1x Business Development | Partnerships and expansion |

---

## 12. Milestones

| Milestone | Target Date | Success Criteria |
|-----------|-------------|-----------------|
| **MVP Launch** | Month 1 | Core booking flow live, 50+ artists onboarded |
| **First 1,000 Users** | Month 2 | 1,000 registered customers |
| **First 100 Bookings** | Month 2 | 100 completed bookings |
| **Payment Integration Live** | Month 1 | Billplz fully integrated and tested |
| **500 Active Providers** | Month 6 | 500+ artists and studios on platform |
| **RM 100K Monthly Revenue** | Month 9 | Sustained monthly revenue > RM 100K |
| **Break-Even** | Month 10-12 | Monthly revenue exceeds monthly costs |
| **Multi-City Expansion** | Month 12 | Operations in 3+ cities |
| **Seed Funding Closed** | Month 6 | RM 500K raised |
| **Series A Readiness** | Month 18 | Strong metrics, ready for Series A |

---

## 13. Key Performance Indicators (KPIs)

### Customer Metrics
- Monthly Active Users (MAU)
- Customer Acquisition Cost (CAC)
- Customer Lifetime Value (LTV)
- Booking conversion rate
- Repeat booking rate
- NPS score

### Provider Metrics
- Active providers count
- Provider churn rate
- Average revenue per provider
- Provider satisfaction score
- Time to first booking

### Financial Metrics
- Gross Transaction Value (GTV)
- Monthly recurring revenue (MRR)
- Gross margin
- Take rate (commission %)
- Burn rate
- Runway

### Operational Metrics
- System uptime (target: 99.9%)
- Average page load time (target: < 2s)
- API response time (target: < 200ms)
- Error rate (target: < 0.1%)
- Support ticket resolution time

---

## 14. Exit Strategy

Potential exit paths:
1. **Acquisition** — By a larger beauty/wellness platform (e.g., Style Theory, Zalora, or international player like Fresha/Booksy)
2. **IPO** — Long-term goal of listing on Malaysian stock exchange (MYX)
3. **Strategic Partnership** — Acquisition of technology/IP by a major player in the beauty/retail space

Target exit timeline: 5-7 years from launch

---

## 15. Appendices

### A. Technology Architecture Diagram
```
[Customer Browser] → [Vercel CDN/Edge] → [Next.js App Router]
                                                ↓
                                    [API Routes / Proxy]
                                                ↓
                              [Neon Auth] [Billplz] [Brevo] [Cloudinary]
                                                ↓
                                    [Neon Postgres DB]
                                                ↓
                              [Drizzle ORM] [Migrations]
                                                ↓
                              [Cloudflare Workers] [Upstash Redis]
```

### B. Key Environment Variables
See `src/lib/env.ts` for the full Zod schema of required and optional environment variables.

### C. Database Schema
See `src/db/schema.ts` for the complete Drizzle schema definition.

### D. Deployment Checklist
See `DEPLOYMENT_CHECKLIST.md` for the production deployment process.

---

*This business plan is a living document and should be reviewed and updated quarterly.*
