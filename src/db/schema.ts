import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    password: text("password"),
    phone: text("phone"),
    location: text("location"),
    avatar: text("avatar"),
    bio: text("bio"),
    role: text("role").default("customer"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)],
);

// One profile row per user. Collapses the old `artists` and `studios`
// tables into a single person record keyed by `user.id`, so a person can
// be created/edited/deleted in exactly one place.
export const profileRoleValues = ["customer", "artist", "studio", "admin"] as const;
export type ProfileRole = (typeof profileRoleValues)[number];

export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").default("customer").notNull(),
    status: varchar("status", { length: 32 }).default("draft").notNull(),
    verified: boolean("verified").default(false),
    available: boolean("available").default(true),
    slug: varchar("slug", { length: 255 }),
    bio: text("bio"),
    description: text("description"),
    portfolio: text("portfolio").array(),
    categories: text("categories").array(),
    specialties: jsonb("specialties").$type<string[]>().default([]),
    languages: text("languages").array(),
    certifications: text("certifications"),
    availability: text("availability"),
    instagramUrl: varchar("instagram_url", { length: 500 }),
    tiktokUrl: varchar("tiktok_url", { length: 500 }),
    willingToTravel: boolean("willing_to_travel").default(false),
    travelCoverage: varchar("travel_coverage", { length: 50 }),
    operatingDays: jsonb("operating_days").$type<string[]>().default([]),
    experience: integer("experience").default(0),
    responseTime: varchar("response_time", { length: 50 }),
    price: decimal("price", { precision: 10, scale: 2 }).default("0"),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    reviewCount: integer("review_count").default(0),
    area: varchar("area", { length: 100 }),
    district: varchar("district", { length: 100 }),
    featured: boolean("featured").default(false),
    bankName: varchar("bank_name", { length: 255 }),
    accountNumber: varchar("account_number", { length: 100 }),
    accountHolder: varchar("account_holder", { length: 255 }),
    onboardingStep: integer("onboarding_step").default(0).notNull(),
    rejectionReason: text("rejection_reason"),
    studioId: text("studio_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("profiles_slug_idx").on(table.slug),
    index("profiles_role_idx").on(table.role),
    index("profiles_status_idx").on(table.status),
    index("profiles_user_id_idx").on(table.userId),
  ],
);

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.providerAccountId, table.provider] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    uniqueIndex("verification_token_token_idx").on(table.token),
    primaryKey({ columns: [table.identifier, table.token] }),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  duration: varchar("duration", { length: 50 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  artistId: text("artist_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  studioId: text("studio_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  popular: boolean("popular").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  rating: integer("rating").notNull(),
  text: text("text"),
  author: varchar("author", { length: 255 }).notNull(),
  authorAvatar: text("author_avatar"),
  service: varchar("service", { length: 255 }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  artistId: text("artist_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  studioId: text("studio_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  artistId: text("artist_id").references(() => users.id, {
    onDelete: "set null",
  }),
  studioId: text("studio_id").references(() => users.id, {
    onDelete: "set null",
  }),
  serviceId: integer("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  date: timestamp("date", { mode: "date" }).notNull(),
  time: varchar("time", { length: 50 }),
  service: varchar("service", { length: 255 }),
  notes: text("notes"),
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 50 }).default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("favorites_user_idx").on(table.userId),
    index("favorites_artist_idx").on(table.artistId),
  ],
);

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  rating: integer("rating").default(5),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 255 }).notNull(),
  payload: jsonb("payload"),
  status: varchar("status", { length: 50 }).default("received"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("MYR"),
  status: varchar("status", { length: 50 }).default("pending"),
  billplzId: varchar("billplz_id", { length: 255 }),
  method: varchar("method", { length: 50 }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentId: integer("payment_id").references(() => payments.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const availabilitySlots = pgTable(
  "availability_slots",
  {
    id: serial("id").primaryKey(),
    artistId: text("artist_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    studioId: text("studio_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    date: timestamp("date", { mode: "date" }).notNull(),
    time: varchar("time", { length: 50 }).notNull(),
    isBooked: boolean("is_booked").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("availability_artist_date_idx").on(table.artistId, table.date),
    index("availability_studio_date_idx").on(table.studioId, table.date),
  ],
);

export const bookingEvents = pgTable(
  "booking_events",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    eventPayload: jsonb("event_payload"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("booking_events_booking_idx").on(table.bookingId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull().default("system"),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    data: jsonb("data"),
    readAt: timestamp("read_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("notifications_user_idx").on(table.userId)],
);

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const inquiries = pgTable(
  "inquiries",
  {
    id: serial("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    location: text("location"),
    message: text("message").notNull(),
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("inquiries_artist_idx").on(table.artistId),
    index("inquiries_status_idx").on(table.status),
  ],
);

export const studioInventory = pgTable("studio_inventory", {
  id: serial("id").primaryKey(),
  studioId: text("studio_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  quantity: integer("quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).unique().notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const communityApplications = pgTable("community_applications", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  yearsOfExperience: text("years_of_experience").notNull(),
  expertiseAreas: jsonb("expertise_areas").$type<string[]>().notNull(),
  portfolioImageUrl: text("portfolio_image_url"),
  portfolioLinks: text("portfolio_links"),
  certifications: text("certifications"),
  socialProfiles: text("social_profiles"),
  availability: text("availability").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const skinProfiles = pgTable(
  "skin_profiles",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    skinType: varchar("skin_type", { length: 50 }),
    skinConcerns: jsonb("skin_concerns").$type<string[]>().default([]),
    undertone: varchar("undertone", { length: 50 }),
    allergies: jsonb("allergies").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("skin_profiles_user_idx").on(table.userId)],
);

export const beautyPreferences = pgTable(
  "beauty_preferences",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    preferredStyles: jsonb("preferred_styles").$type<string[]>().default([]),
    preferredProducts: jsonb("preferred_products").$type<string[]>().default([]),
    makeupNotes: text("makeup_notes"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("beauty_preferences_user_idx").on(table.userId)],
);

export const inspirationBoards = pgTable(
  "inspiration_boards",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    coverImage: text("cover_image"),
    isPublic: boolean("is_public").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("inspiration_boards_user_idx").on(table.userId)],
);

export const savedInspiration = pgTable(
  "saved_inspiration",
  {
    id: serial("id").primaryKey(),
    boardId: integer("board_id")
      .notNull()
      .references(() => inspirationBoards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    sourceArtistId: text("source_artist_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sourceType: varchar("source_type", { length: 50 }).default("user_upload"),
    caption: text("caption"),
    tags: jsonb("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("saved_inspiration_board_idx").on(table.boardId),
    index("saved_inspiration_user_idx").on(table.userId),
  ],
);

export const loyaltyTiers = pgTable("loyalty_tiers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  minPoints: integer("min_points").notNull().default(0),
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }).default("1.00"),
  perks: jsonb("perks").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const loyaltyPoints = pgTable(
  "loyalty_points",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    balance: integer("balance").notNull().default(0),
    lifetimeEarned: integer("lifetime_earned").notNull().default(0),
    lifetimeRedeemed: integer("lifetime_redeemed").notNull().default(0),
    tier: varchar("tier", { length: 50 }).default("bronze"),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("loyalty_points_user_idx").on(table.userId)],
);

export const subscriptionPlans = pgTable(
  "subscription_plans",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    description: text("description"),
    price: integer("price").notNull(),
    currency: varchar("currency", { length: 10 }).default("MYR"),
    durationDays: integer("duration_days").notNull().default(30),
    features: jsonb("features").$type<string[]>().default([]),
    popular: boolean("popular").default(false),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: integer("plan_id")
      .notNull()
      .references(() => subscriptionPlans.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
    currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
    billplzBillId: varchar("billplz_bill_id", { length: 255 }),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("subscriptions_user_idx").on(table.userId),
    index("subscriptions_status_idx").on(table.status),
  ],
);

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    date: timestamp("date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    time: varchar("time", { length: 100 }),
    endTime: varchar("end_time", { length: 100 }),
    location: varchar("location", { length: 255 }),
    address: text("address"),
    category: varchar("category", { length: 100 }).default("Workshop"),
    image: text("image").default("/placeholder.svg"),
    organizerName: varchar("organizer_name", { length: 255 }),
    organizerContact: varchar("organizer_contact", { length: 255 }),
    ticketUrl: varchar("ticket_url", { length: 500 }),
    featured: boolean("featured").default(false),
    published: boolean("published").default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("events_date_idx").on(table.date),
    index("events_category_idx").on(table.category),
    index("events_published_idx").on(table.published),
  ],
);

export const loyaltyTransactions = pgTable(
  "loyalty_transactions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    referenceId: varchar("reference_id", { length: 255 }),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("loyalty_transactions_user_idx").on(table.userId),
    index("loyalty_transactions_created_idx").on(table.createdAt),
  ],
);

export const receivedEmails = pgTable(
  "received_emails",
  {
    id: serial("id").primaryKey(),
    recipient: text("recipient").notNull(),
    sender: text("sender").notNull(),
    subject: text("subject"),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    source: text("source").default("brevo-inbound"),
    messageId: text("message_id"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("received_emails_recipient_idx").on(table.recipient),
    index("received_emails_created_idx").on(table.createdAt),
  ],
);

export const referralStatusValues = ["clicked", "registered", "booked", "rewarded"] as const;
export type ReferralStatus = (typeof referralStatusValues)[number];

export const referrals = pgTable(
  "referrals",
  {
    id: serial("id").primaryKey(),
    referrerType: varchar("referrer_type", { length: 50 }).notNull(),
    referrerUserId: text("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    referredUserId: text("referred_user_id").references(() => users.id, { onDelete: "set null" }),
    referredEmail: text("referred_email"),
    status: varchar("status", { length: 50 }).notNull().default("clicked"),
    bookingId: integer("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    pointsAwarded: integer("points_awarded").default(0),
    clickedAt: timestamp("clicked_at", { mode: "date" }).defaultNow().notNull(),
    registeredAt: timestamp("registered_at", { mode: "date" }),
    bookedAt: timestamp("booked_at", { mode: "date" }),
    rewardedAt: timestamp("rewarded_at", { mode: "date" }),
  },
  (table) => [
    index("referrals_referrer_idx").on(table.referrerType, table.referrerUserId),
    index("referrals_status_idx").on(table.status),
    index("referrals_referred_user_idx").on(table.referredUserId),
  ],
);


