# Leish! (leish.my) — Module Flow Diagrams

## Table of Contents

1. [Application Bootstrap & Request Lifecycle](#1-application-bootstrap--request-lifecycle)
2. [Authentication Module](#2-authentication-module)
3. [Middleware / Proxy](#3-middleware--proxy)
4. [Database Layer](#4-database-layer)
5. [Booking Module](#5-booking-module)
6. [Payment Module (Billplz)](#6-payment-module-billplz)
7. [Quote System](#7-quote-system)
8. [Email Module (Brevo)](#8-email-module-brevo)
9. [Loyalty / Rewards Module](#9-loyalty--rewards-module)
10. [Notifications Module](#10-notifications-module)
11. [Cloudinary (Image Storage)](#11-cloudinary-image-storage)
12. [Rate Limiting Module](#12-rate-limiting-module)
13. [Cron Jobs Module](#13-cron-jobs-module)
14. [Admin Dashboard](#14-admin-dashboard)
15. [Artist Dashboard](#15-artist-dashboard)
16. [Studio Dashboard](#16-studio-dashboard)
17. [Homepage & Public Pages](#17-homepage--public-pages)
18. [Search Module](#18-search-module)
19. [Favorites Module](#19-favorites-module)
20. [Reviews Module](#20-reviews-module)
21. [Events Module](#21-events-module)
22. [Subscription Module](#22-subscription-module)
23. [Referral Module](#23-referral-module)
24. [Contact / Inquiry Module](#24-contact--inquiry-module)
25. [Onboarding Flow](#25-onboarding-flow)
26. [Analytics Module](#26-analytics-module)
27. [URL Shortener (Cloudflare Worker)](#27-url-shortener-cloudflare-worker)
28. [Email Worker (Cloudflare)](#28-email-worker-cloudflare)

---

## 1. Application Bootstrap & Request Lifecycle

```mermaid
flowchart TD
    A[User Request] --> B[src/proxy.ts Middleware]
    B --> C{Route Type?}

    C -->|Public Page| D[Generate CSP Nonce]
    C -->|Protected Page| E[Check Session Cookie]
    C -->|Public API| D
    C -->|Protected API| F[Check Auth Session]
    C -->|Rate-Limited API| G[Upstash Redis Rate Limit]

    D --> H[Apply Security Headers]
    E -->|No Session| I[Redirect to /login]
    E -->|Has Session| H
    F -->|No Session| J[Return 401]
    F -->|Has Session| H
    G -->|Exceeded| K[Return 429]
    G -->|OK| H

    H --> L[Next.js App Router]
    L --> M[src/app/layout.tsx]
    M --> N[Providers Wrapper]
    N --> O[AuthContext + FavoritesContext + NotificationsContext + ToastContext]
    O --> P[Route Page Component]
    P --> Q[Server Component / Client Component]
    Q --> R[API Route or Database Query]
    R --> S[Response to User]
```

---

## 2. Authentication Module

```mermaid
flowchart TD
    A[User Action] --> B{Auth Action?}

    B -->|Register| C[POST /api/auth/sign-up/email]
    B -->|Login| D[POST /api/auth/sign-in/email]
    B -->|OAuth| E[POST /api/auth/sign-in/social]
    B -->|Logout| F[POST /api/auth/sign-out]
    B -->|Session Check| G[GET /api/auth/get-session]

    C --> H[Neon Auth - Better Auth]
    D --> H
    E --> H

    H --> I[Create/Verify User in DB]
    I --> J[Set Session Cookie]
    J --> K[__Secure-neon-auth.session_token]

    K --> L[AuthContext.tsx - Client]
    L --> M[useSession Hook]
    M --> N{Session Valid?}
    N -->|Yes| O[Load User Profile from /api/user]
    N -->|No| P[Redirect to /login]

    O --> Q[Fetch Profile from profiles Table]
    Q --> R[Set User State - role, isAdmin, etc.]
    R --> S[Render Dashboard / Protected Content]

    F --> T[Clear Session Cookie]
    T --> U[Redirect to /]

    subgraph "Server-Side Auth"
        G --> V[getSession from lib/auth/auth.ts]
        V --> W[Neon Auth SDK]
        W --> X[Validate JWT / Session Token]
    end
```

---

## 3. Middleware / Proxy

```mermaid
flowchart TD
    A[Incoming Request] --> B[src/proxy.ts]

    B --> C[Generate CSP Nonce]
    C --> D{Path Classification}

    D -->|/api/auth/*| E[Public - Skip Auth]
    D -->|/api/health| E
    D -->|/api/webhook| E
    D -->|/api/user/*| F[Protected API - Check Session]
    D -->|/profile, /favorites, etc.| G[Protected Page - Check Cookie]
    D -->|/bookings/:id| H[Public - Booking Detail]
    D -->|/dashboard/*| I[Dashboard Auth Check]
    D -->|Everything Else| J[Public Route]

    F --> K{Has Valid Session?}
    K -->|No| L[Return 401 JSON]
    K -->|Yes| M[Continue to Handler]

    G --> N{Has Session Cookie?}
    N -->|No| O[Redirect to /login]
    N -->|Yes| P[Continue to Page]

    I --> Q[Neon Auth Middleware Check]
    Q -->|No Session| R[Redirect to /login]
    Q -->|Has Session| S[Continue to Dashboard]

    J --> T[Apply Security Headers]
    M --> T
    P --> T
    S --> T
    E --> T

    T --> U[X-Content-Type-Options: nosniff]
    T --> V[X-Frame-Options: DENY]
    T --> W[CSP Header with Nonce]
    T --> X[X-Nonce Header for Layout]

    U --> Y[Next Response]
    V --> Y
    W --> Y
    X --> Y
```

---

## 4. Database Layer

```mermaid
flowchart TD
    A[Application Code] --> B[Drizzle ORM]

    B --> C[src/db/index.ts]
    C --> D[Neon Serverless Driver]
    D --> E[Neon Postgres]

    subgraph "Schema Tables (src/db/schema.ts)"
        F[users]
        G[profiles]
        H[accounts / sessions]
        I[categories]
        J[services / servicePackages]
        K[bookings]
        L[payments]
        M[quoteOptions]
        N[payouts]
        O[reviews]
        P[favorites]
        Q[availabilitySlots]
        R[bookingEvents]
        S[notifications]
        T[contacts / inquiries]
        U[loyaltyPoints / loyaltyTransactions / loyaltyTiers]
        V[webhookEvents]
        W[referrals]
        X[subscriptions]
        Y[events]
    end

    B --> F
    B --> G
    B --> H
    B --> I
    B --> J
    B --> K
    B --> L
    B --> M
    B --> N
    B --> O
    B --> P
    B --> Q
    B --> R
    B --> S
    B --> T
    B --> U
    B --> V
    B --> W
    B --> X
    B --> Y

    subgraph "Migrations (drizzle/)"
        AA[20+ Migration Files]
        AB[pnpm db:generate]
        AC[pnpm db:migrate]
        AB --> AA
        AA --> AC
    end
```

---

## 5. Booking Module

```mermaid
flowchart TD
    A[Customer] --> B[Select Artist/Studio]
    B --> C[Choose Service & Date]
    C --> D[POST /api/bookings - Create Inquiry]

    D --> E{Booking Type?}
    E -->|Standard| F[Create Booking - status: pending]
    E -->|Quote-Based| G[Create Booking - status: quote_requested]

    F --> H[Send Email to Artist/Studio]
    G --> H

    H --> I[Artist/Studio Reviews Inquiry]
    I --> J{Action?}

    J -->|Accept & Quote| K[POST /api/bookings/:id/accept-quote]
    J -->|Reject| L[POST /api/bookings/:id/reject]
    J -->|Request Changes| M[POST /api/bookings/:id/request-changes]

    K --> N[Create Quote Options]
    N --> O[Send Quote Ready Email to Customer]
    O --> P[Customer Reviews Quote]

    P --> Q{Customer Action?}
    Q -->|Accept| R[POST /api/bookings/:id/accept-quote]
    Q -->|Reject| S[POST /api/bookings/:id/reject-quote]

    R --> T[Create Billplz Bill]
    T --> U[Send Payment Link Email]
    U --> V[Customer Pays via Billplz]

    V --> W[Webhook: /api/webhook/billplz]
    W --> X[Update Booking Status - confirmed]
    X --> Y[Update Payment Status - paid]
    Y --> Z[Send Confirmation Emails]

    Z --> AA[Booking Completed]
    AA --> AB[Award Loyalty Points]
    AB --> AC[Auto-Release Payment - Cron Job]

    subgraph "Booking Statuses"
        AD[pending]
        AE[quote_requested]
        AF[quote_sent]
        AG[confirmed]
        AH[completed]
        AI[cancelled]
        AJ[no_show]
    end
```

---

## 6. Payment Module (Billplz)

```mermaid
flowchart TD
    A[Booking Confirmed] --> B[createBillForBooking]
    B --> C{Idempotency Check}
    C -->|Existing Payment| D[Return Cached Result]
    C -->|New Payment| E[Validate Booking]

    E --> F[Calculate Amount]
    F --> G[Create Billplz Bill via API]
    G --> H[Store Payment Record in DB]
    H --> I[Return Bill URL]

    I --> J[Customer Redirected to Billplz]
    J --> K{Payment Result?}

    K -->|Success| L[Billplz POST /api/webhook/billplz]
    K -->|Failure| M[Payment Failed Page]

    L --> N[Verify Webhook Signature]
    N --> O[Update Payment Status - paid]
    O --> P[Update Booking Status - confirmed]
    P --> Q[Send Payment Receipt Email]
    Q --> R[Send Booking Confirmation Email]
    R --> S[Trigger Loyalty Points]

    subgraph "Payment Flow"
        T[Deposit Payment - 30% default]
        U[Second Payment - Cron Job]
        V[Final Payment - On Completion]
    end

    subgraph "Cron: auto-release-payments"
        W[Check Completed Bookings]
        X[Verify Payment Released]
        Y[Release Funds to Artist/Studio]
    end

    subgraph "Cron: reconcile-payments"
        Z[Check Billplz API for Status]
        AA[Sync Payment Records]
    end
```

---

## 7. Quote System

```mermaid
flowchart TD
    A[Artist/Studio] --> B[Receives Booking Inquiry]
    B --> C[Creates Quote with Options]

    C --> D[Option 1: Basic Package]
    C --> E[Option 2: Standard Package]
    C --> F[Option 3: Premium Package]

    D --> G[Each Option Has:]
    E --> G
    F --> G

    G --> H[Service Price]
    G --> I[Travel Fee]
    G --> J[Accommodation Fee]
    G --> K[Discount]
    G --> L[Extras Array]

    H --> M[Send Quote to Customer]
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Customer Views Quote Page]
    N --> O{Customer Decision}

    O -->|Select Option| P[POST /api/bookings/:id/accept-quote]
    O -->|Reject All| Q[POST /api/bookings/:id/reject-quote]
    O -->|Request Changes| R[POST /api/bookings/:id/request-changes]

    P --> S[Mark Selected Option]
    S --> T[Create Billplz Bill]
    T --> U[Payment Flow Begins]
```

---

## 8. Email Module (Brevo)

```mermaid
flowchart TD
    A[Application Trigger] --> B{Email Type?}

    B -->|Welcome| C[sendWelcomeEmail]
    B -->|Booking Received| D[sendBookingReceivedEmail]
    B -->|Provider New Booking| E[sendProviderNewBookingEmail]
    B -->|Quote Ready| F[sendQuoteReadyEmail]
    B -->|Quote Rejected| G[sendQuoteRejectedEmail]
    B -->|Payment Receipt| H[sendPaymentReceiptEmail]
    B -->|Subscription Created| I[sendSubscriptionCreatedEmail]
    B -->|Subscription Canceled| J[sendSubscriptionCanceledEmail]
    B -->|Payout Notification| K[sendPayoutNotificationEmail]

    C --> L[Load HTML Template]
    D --> L
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L

    L --> M[Template Variables Interpolation]
    M --> N[buildBrevoPayload]
    N --> O[sendEmail via Brevo API]

    O --> P{Success?}
    P -->|Yes| Q[Log Success]
    P -->|No| R{Error Type?}

    R -->|Transient| S[Retry with Exponential Backoff]
    R -->|Permanent| T[Log Error to Sentry]
    R -->|Unknown| T

    S --> U{Retry Count < 3?}
    U -->|Yes| O
    U -->|No| T

    subgraph "Templates (lib/email/templates.ts)"
        V[bookingConfirmationTemplate]
        W[welcomeEmailTemplate]
        X[paymentReceiptTemplate]
        Y[loyaltyPointsEarnedTemplate]
        Z[providerNewBookingTemplate]
        AA[subscriptionCreatedTemplate]
        AB[subscriptionCanceledTemplate]
        AC[notificationEmailTemplate]
        AD[payoutNotificationTemplate]
    end
```

---

## 9. Loyalty / Rewards Module

```mermaid
flowchart TD
    A[Trigger Event] --> B{Event Type?}

    B -->|Booking Completed| C[100 Points]
    B -->|Review Submitted| D[50 Points]
    B -->|Referral| E[200 Points]
    B -->|Profile Complete| F[100 Points]
    B -->|Birthday| G[50 Points]
    B -->|Social Share| H[25 Points]

    C --> I[awardPoints Function]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J[Get Current Tier]
    J --> K[Get Tier Multiplier]
    K --> L[Calculate Final Points]

    L --> M[Upsert loyalty_points Table]
    M --> N[Insert loyalty_transactions Record]
    N --> O{Lifetime Earned Threshold?}

    O -->|>= 5000| P[Tier: Platinum - 2x Multiplier]
    O -->|>= 2000| Q[Tier: Gold - 1.5x Multiplier]
    O -->|>= 500| R[Tier: Silver - 1.25x Multiplier]
    O -->|< 500| S[Tier: Bronze - 1x Multiplier]

    P --> T[Update loyalty_points.tier]
    Q --> T
    R --> T
    S --> T

    T --> U[Return Points Awarded]

    subgraph "Tiers (loyalty_tiers table)"
        V[Bronze: 0+ pts, 1x]
        W[Silver: 500+ pts, 1.25x]
        X[Gold: 2000+ pts, 1.5x]
        Y[Platinum: 5000+ pts, 2x]
    end
```

---

## 10. Notifications Module

```mermaid
flowchart TD
    A[System Event] --> B{Notification Channel?}

    B -->|In-App| C[Insert into notifications Table]
    B -->|Email| D[Send via Brevo]
    B -->|WhatsApp| E[Send via WhatsApp API]

    C --> F[NotificationsContext.tsx]
    F --> G[NotificationsDropdown Component]
    G --> H[User Sees Notification Badge]
    H --> I[User Clicks to View]
    I --> J[Mark as Read - Set readAt]

    D --> K[Email Templates]
    K --> L[User Receives Email]

    E --> M[WhatsApp Cloud API]
    M --> N[User Receives WhatsApp Message]

    subgraph "WhatsApp Flow (lib/notifications/whatsapp.ts)"
        O[Format Phone Number]
        O --> P[POST to Graph API]
        P --> Q{Success?}
        Q -->|Yes| R[Return messageId]
        Q -->|No| S[Return Error]
    end
```

---

## 11. Cloudinary (Image Storage)

```mermaid
flowchart TD
    A[User Upload] --> B[POST /api/cloudinary/sign]
    B --> C[Generate Signed Upload URL]
    C --> D[Client-Side Upload to Cloudinary]

    D --> E{Upload Success?}
    E -->|Yes| F[Return Image URL]
    E -->|No| G[Upload Error]

    F --> H[Store URL in Database]
    H --> I[Profile Image / Portfolio Image]

    subgraph "Image Management"
        J[cloudinary-client.ts - Client Upload]
        K[cloudinary-server.ts - Server Operations]
        L[cloudinary-delete-client.ts - Client Delete]
        M[cloudinary-sweep.ts - Cleanup Orphans]
        N[cloudinary-url-gen.ts - URL Generation]
    end

    subgraph "Cron: sweep-orphans"
        O[Scan Cloudinary for Orphaned Images]
        P[Compare with DB References]
        Q[Delete Unreferenced Images]
    end
```

---

## 12. Rate Limiting Module

```mermaid
flowchart TD
    A[API Request] --> B[lib/rate-limit.ts]
    B --> C{Redis Available?}

    C -->|Yes| D[Upstash Redis]
    C -->|No| E[In-Memory Fallback]

    D --> F[INCR leish:rl:identifier]
    F --> G{Count <= 60?}
    G -->|Yes| H[Allow Request]
    G -->|No| I[Block - 429]

    E --> J[Check In-Memory Map]
    J --> K{Window Expired?}
    K -->|Yes| L[Reset Counter]
    K -->|No| M{Count <= 60?}
    M -->|Yes| N[Allow + Increment]
    M -->|No| O[Block - 429]

    L --> P[Allow Request]

    H --> Q[Continue to Handler]
    P --> Q

    subgraph "Rate Limit Config"
        R[Max: 60 requests]
        S[Window: 60 seconds]
        T[Key: leish:rl:identifier]
    end
```

---

## 13. Cron Jobs Module

```mermaid
flowchart TD
    A[Vercel Cron Trigger] --> B{Cron Path?}

    B -->|/api/cron/sync-auth-users| C[Sync Auth Users]
    B -->|/api/cron/sweep-orphans| D[Sweep Orphaned Files]
    B -->|/api/cron/reconcile-payments| E[Reconcile Payments]
    B -->|/api/cron/auto-release-payments| F[Auto-Release Payments]
    B -->|/api/cron/booking-reminders| G[Send Booking Reminders]
    B -->|/api/cron/send-second-payments| H[Send Second Payment Requests]

    C --> I[CRON_SECRET Auth Check]
    D --> I
    E --> I
    F --> I
    G --> I
    H --> I

    I --> J{Valid Secret?}
    J -->|No| K[Return 401]
    J -->|Yes| L[Execute Job]

    L --> M[Log Job Execution via cron-tracking.ts]

    subgraph "sync-auth-users"
        N[Query Neon Auth Users]
        O[Sync with users Table]
    end

    subgraph "sweep-orphans"
        P[Scan Cloudinary Images]
        Q[Compare with DB]
        R[Delete Orphans]
    end

    subgraph "reconcile-payments"
        S[Check Billplz Payment Status]
        T[Update payments Table]
        U[Update bookings Table]
    end

    subgraph "auto-release-payments"
        V[Find Completed Bookings]
        W[Check Release Eligibility]
        X[Create Payout Records]
    end

    subgraph "booking-reminders"
        Y[Find Upcoming Bookings]
        Z[Send Reminder Emails]
    end

    subgraph "send-second-payments"
        AA[Find Bookings Needing Second Payment]
        AB[Create Billplz Bills]
        AC[Send Payment Request Emails]
    end
```

---

## 14. Admin Dashboard

```mermaid
flowchart TD
    A[Admin Login] --> B[/dashboard/admin]
    B --> C[Admin Layout - Auth Check]

    C --> D{Admin Section?}

    D -->|Overview| E[GET /api/admin - Stats]
    D -->|People| F[GET /api/admin/people - Users List]
    D -->|Moderation| G[GET /api/admin/moderation - Pending Profiles]
    D -->|Reports| H[GET /api/admin/reports - Analytics]
    D -->|Settings| I[GET /api/admin/settings - Config]

    E --> J[Dashboard Overview Cards]
    J --> K[Total Users, Bookings, Revenue]

    F --> L[User Management]
    L --> M[View / Edit / Delete Users]
    M --> N[Toggle Admin Status]
    M --> O[Change User Roles]

    G --> P[Profile Moderation Queue]
    P --> Q[Approve / Reject Profiles]
    Q --> R[Send Rejection Reason Email]

    H --> S[Revenue Reports]
    S --> T[Booking Analytics]
    T --> U[User Growth Charts]

    I --> V[System Settings]
    V --> W[Platform Configuration]
```

---

## 15. Artist Dashboard

```mermaid
flowchart TD
    A[Artist Login] --> B[/dashboard/artist]
    B --> C[Artist Layout - Auth Check]

    C --> D{Artist Section?}

    D -->|Overview| E[GET /api/user - Profile Stats]
    D -->|Bookings| F[GET /api/bookings - My Bookings]
    D -->|Services| G[GET /api/services - My Services]
    D -->|Portfolio| H[GET /api/cloudinary - My Images]
    D -->|Analytics| I[GET /api/analytics - Performance]
    D -->|Quotes| J[GET /api/bookings - Quote Requests]
    D -->|Share| K[Public Profile Link]

    E --> L[Profile Completion Status]
    L --> M[Quick Actions Cards]

    F --> N[Booking Management Table]
    N --> O[View Details]
    N --> P[Accept / Reject]
    N --> Q[Send Quote]

    G --> R[Service CRUD]
    R --> S[Add / Edit / Delete Services]
    S --> T[Set Pricing & Packages]

    H --> U[Portfolio Grid]
    U --> V[Upload Images via Cloudinary]
    U --> W[Reorder / Delete Images]

    I --> X[Booking Statistics]
    X --> Y[Revenue Charts]
    Y --> Z[Rating Summary]

    J --> AA[Quote Request List]
    AA --> AB[Create Quote with Options]
```

---

## 16. Studio Dashboard

```mermaid
flowchart TD
    A[Studio Login] --> B[/dashboard/studio]
    B --> C[Studio Layout - Auth Check]

    C --> D{Studio Section?}

    D -->|Calendar| E[GET /api/calendar - Schedule]
    D -->|Staff| F[GET /api/studios/staff - Staff List]
    D -->|Inventory| G[GET /api/inventory - Products]
    D -->|Finance| H[GET /api/finance - Revenue]
    D -->|Quotes| I[GET /api/bookings - Quote Requests]
    D -->|Share| J[Public Profile Link]

    E --> K[Calendar View]
    K --> L[View Bookings by Date]
    K --> M[Manage Availability Slots]

    F --> N[Staff Management]
    N --> O[Add / Edit Staff Members]
    N --> P[Assign Staff to Bookings]

    G --> Q[Inventory Management]
    Q --> R[Track Products & Supplies]
    Q --> S[Low Stock Alerts]

    H --> T[Financial Overview]
    T --> U[Revenue by Period]
    T --> V[Payout History]
    T --> W[Pending Payments]

    I --> X[Quote Management]
    X --> Y[Create Quotes with Options]
```

---

## 17. Homepage & Public Pages

```mermaid
flowchart TD
    A[User Visits /] --> B[src/app/page.tsx]
    B --> C[Server Component]

    C --> D[Fetch Data in Parallel]
    D --> E[Featured Artists]
    D --> F[Categories]
    D --> G[Testimonials]

    E --> H[GET /api/artists?featured=true]
    F --> I[GET /api/services - Categories]
    G --> J[Static Testimonials Data]

    H --> K[Render Hero Section]
    I --> L[Render Categories Grid]
    J --> M[Render Testimonials Carousel]

    K --> N[Search Bar Component]
    N --> O[ArtistSearchForm]
    O --> P[Search by Location / Category]

    subgraph "Public Pages"
        Q[/artists - Artist Listing]
        R[/studios - Studio Listing]
        S[/artists/:id - Artist Detail]
        T[/studios/:id - Studio Detail]
        U[/events - Events Listing]
        V[/contact - Contact Form]
        W[/faq - FAQ Page]
        X[/rewards - Rewards Info]
    end

    Q --> Y[GET /api/artists - List]
    R --> Z[GET /api/studios - List]
    S --> AA[GET /api/artists/:id - Detail]
    T --> AB[GET /api/studios/:id - Detail]
```

---

## 18. Search Module

```mermaid
flowchart TD
    A[User Search Input] --> B[ArtistSearchForm Component]
    B --> C[Search Modal / Inline Search]

    C --> D{Search Type?}
    D -->|Location| E[Google Places Autocomplete]
    D -->|Category| F[Category Dropdown]
    D -->|Name| G[Text Input]

    E --> H[GET /api/artists?location=X]
    F --> I[GET /api/artists?category=X]
    G --> J[GET /api/artists?search=X]

    H --> K[Database Query with Filters]
    I --> K
    J --> K

    K --> L[Apply Pagination]
    L --> M[Return Results]
    M --> N[Render Artist/Studio Cards]
```

---

## 19. Favorites Module

```mermaid
flowchart TD
    A[User Clicks Heart Icon] --> B{Action?}
    B -->|Add Favorite| C[POST /api/user/favorites]
    B -->|Remove Favorite| D[DELETE /api/user/favorites/:id]
    B -->|View Favorites| E[GET /api/user/favorites]

    C --> F[Insert into favorites Table]
    F --> G[Update FavoritesContext]
    G --> H[Heart Icon Filled]

    D --> I[Delete from favorites Table]
    I --> G
    G --> J[Heart Icon Empty]

    E --> K[Query favorites Table with Joins]
    K --> L[Return Artist/Studio Data]
    L --> M[Render Favorites Page]

    subgraph "FavoritesContext.tsx"
        N[favorites State Array]
        O[toggleFavorite Function]
        P[isFavorite Check]
        Q[loadFavorites Function]
    end
```

---

## 20. Reviews Module

```mermaid
flowchart TD
    A[User Submits Review] --> B[POST /api/reviews]
    B --> C[Validate Review Data]
    C --> D[Insert into reviews Table]
    D --> E[Update Profile Rating]
    E --> F[Recalculate Average Rating]
    F --> G[Award Loyalty Points - 50 pts]

    H[Artist/Studio View Reviews] --> I[GET /api/reviews?artistId=X]
    I --> J[Query reviews Table]
    J --> K[Return Reviews List]
    K --> L[Render ReviewList Component]

    M[Write Review Form] --> N[ReviewForm Component]
    N --> O[Star Rating Selection]
    N --> P[Review Text Input]
    N --> Q[Submit Button]
```

---

## 21. Events Module

```mermaid
flowchart TD
    A[Admin Creates Event] --> B[POST /api/events]
    B --> C[Insert into events Table]
    C --> D[Event Visible on /events]

    E[User Views Events] --> F[GET /api/events]
    F --> G[Query events Table]
    G --> H[Render Events Page]

    I[User RSVPs to Event] --> J[POST /api/events/:id/rsvp]
    J --> K[Store RSVP Record]
    K --> L[Send Confirmation Email]
```

---

## 22. Subscription Module

```mermaid
flowchart TD
    A[Artist/Studio] --> B[Subscribe to Leish Plus]
    B --> C[POST /api/subscriptions]
    C --> D[Create Subscription Record]
    D --> E[Send Subscription Created Email]
    E --> F[Unlock Premium Features]

    F --> G[Featured Listing]
    F --> H[Priority Support]
    F --> I[Advanced Analytics]

    J[Cancellation Request] --> K[POST /api/subscriptions/cancel]
    K --> L[Update Subscription Status]
    L --> M[Send Cancellation Email]
    M --> N[Revoke Premium Features]

    O[Cron: Check Expired Subscriptions] --> P[Auto-Downgrade]
```

---

## 23. Referral Module

```mermaid
flowchart TD
    A[User Shares Referral Link] --> B[Referral Code Generated]
    B --> C[New User Clicks Link]
    C --> D[Register with Referral Code]
    D --> E[POST /api/referrals]
    E --> F[Store Referral Record]

    F --> G{Referral Complete?}
    G -->|New User Books| H[Award 200 Points to Referrer]
    G -->|New User Registers| I[Award 50 Points to Referrer]

    H --> J[Update loyalty_points Table]
    I --> J
    J --> K[Send Referral Bonus Email]
```

---

## 24. Contact / Inquiry Module

```mermaid
flowchart TD
    A[User Fills Contact Form] --> B[POST /api/contact]
    B --> C[Validate Form Data]
    C --> D[Insert into contacts Table]
    D --> E[Send Notification Email to Admin]

    F[Artist Receives Inquiry] --> G[POST /api/inquiries]
    G --> H[Insert into inquiries Table]
    H --> I[Send Email to Artist]
    I --> J[Artist Responds]
    J --> K[Update inquiry Status]
```

---

## 25. Onboarding Flow

```mermaid
flowchart TD
    A[New Artist/Studio] --> B[/onboarding]
    B --> C[Step 1: Basic Info]
    C --> D[Step 2: Profile Details]
    D --> E[Step 3: Services & Pricing]
    E --> F[Step 4: Portfolio Upload]
    F --> G[Step 5: Availability]
    G --> H[Step 6: Bank Details]
    H --> I[Submit for Review]

    I --> J[POST /api/user/onboarding]
    J --> K[Update profiles.onboardingStep]
    K --> L[Set status: pending_review]

    L --> M[Admin Reviews in Moderation]
    M --> N{Decision?}
    N -->|Approve| O[Set status: approved]
    N -->|Reject| P[Set status: rejected]

    O --> Q[Send Approval Email]
    P --> R[Send Rejection Email with Reason]

    Q --> S[Profile Goes Live]
    S --> T[Visible in Search Results]
```

---

## 26. Analytics Module

```mermaid
flowchart TD
    A[Dashboard Request] --> B[GET /api/analytics]
    B --> C{User Role?}

    C -->|Artist| D[Artist Analytics]
    C -->|Studio| E[Studio Analytics]
    C -->|Admin| F[Platform Analytics]

    D --> G[Query Own Bookings]
    G --> H[Calculate Revenue]
    G --> I[Count Bookings]
    G --> J[Average Rating]

    E --> K[Query Studio Bookings]
    K --> L[Revenue by Staff]
    K --> M[Service Popularity]
    K --> N[Calendar Utilization]

    F --> O[Query All Data]
    O --> P[Total Users]
    O --> Q[Total Bookings]
    O --> R[Total Revenue]
    O --> S[Conversion Rates]

    H --> T[Render Charts]
    I --> T
    J --> T
    L --> T
    M --> T
    N --> T
    P --> T
    Q --> T
    R --> T
    S --> T
```

---

## 27. URL Shortener (Cloudflare Worker)

```mermaid
flowchart TD
    A[Short URL Request] --> B[Cloudflare Worker]
    B --> C[Lookup Short Code in KV]
    C --> D{Found?}
    D -->|Yes| E[302 Redirect to Original URL]
    D -->|No| F[404 Not Found]

    G[Create Short URL] --> H[POST /api/url-shortener]
    H --> I[Generate Short Code]
    I --> J[Store in KV Store]
    J --> K[Return Short URL]
```

---

## 28. Email Worker (Cloudflare)

```mermaid
flowchart TD
    A[Inbound Email] --> B[Cloudflare Email Routing]
    B --> C[Cloudflare Worker]
    C --> D[Parse Email Headers]
    D --> E[Extract Subject & Body]
    E --> F[Store in D1 Database]
    F --> G[Forward to Processing Queue]

    H[Process Email] --> I[Match to User/Booking]
    I --> J[Create Notification Record]
    J --> K[Send Processing Summary]
```

---

## Cross-Module Data Flow Summary

```mermaid
flowchart TD
    A[User Request] --> B[Proxy Middleware]
    B --> C[Auth Check]
    C --> D[Route Handler]

    D --> E[Database - Drizzle ORM]
    D --> F[External APIs]

    E --> G[Neon Postgres]
    F --> H[Billplz - Payments]
    F --> I[Brevo - Email]
    F --> J[Cloudinary - Images]
    F --> K[WhatsApp API]
    F --> L[Upstash Redis]

    D --> M[Response]
    M --> N[Email Triggers]
    M --> O[Notification Triggers]
    M --> P[Loyalty Point Awards]

    N --> I
    O --> Q[In-App Notifications]
    P --> E

    R[Cron Jobs] --> E
    R --> H
    R --> I
    R --> S[Cloudinary Cleanup]
```
