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
    specialties: jsonb("specialties").$type<string[]>().default([]),
    role: text("role").default("customer"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_email_idx").on(table.email)],
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

export const artists = pgTable(
  "artists",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }),
    image: text("image"),
    phone: varchar("phone", { length: 50 }),
    location: varchar("location", { length: 255 }),
    area: varchar("area", { length: 100 }),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    reviewCount: integer("review_count").default(0),
    bio: text("bio"),
    portfolio: text("portfolio").array(),
    available: boolean("available").default(true),
    verified: boolean("verified").default(false),
    experience: integer("experience").default(0),
    languages: text("languages").array(),
    responseTime: varchar("response_time", { length: 50 }),
    price: decimal("price", { precision: 10, scale: 2 }).default("0"),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
);

export const artistCategories = pgTable(
  "artist_categories",
  {
    artistId: integer("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.artistId, table.categoryId] })],
);

export const studios = pgTable("studios", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  email: varchar("email", { length: 255 }),
  image: text("image"),
  phone: varchar("phone", { length: 50 }),
  location: varchar("location", { length: 255 }),
  area: varchar("area", { length: 100 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  featured: boolean("featured").default(false),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const studioCategories = pgTable(
  "studio_categories",
  {
    studioId: integer("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.studioId, table.categoryId] })],
);

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  duration: varchar("duration", { length: 50 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  artistId: integer("artist_id").references(() => artists.id, {
    onDelete: "cascade",
  }),
  studioId: integer("studio_id").references(() => studios.id, {
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
  artistId: integer("artist_id").references(() => artists.id, {
    onDelete: "cascade",
  }),
  studioId: integer("studio_id").references(() => studios.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  artistId: integer("artist_id").references(() => artists.id, {
    onDelete: "set null",
  }),
  studioId: integer("studio_id").references(() => studios.id, {
    onDelete: "set null",
  }),
  serviceId: integer("service_id").references(() => services.id, {
    onDelete: "set null",
  }),
  date: timestamp("date", { mode: "date" }).notNull(),
  time: varchar("time", { length: 50 }),
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
    artistId: integer("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
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

export const muaBankAccounts = pgTable("mua_bank_accounts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 100 }).notNull(),
  accountHolder: varchar("account_holder", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  bankAccountId: integer("bank_account_id").references(
    () => muaBankAccounts.id,
    { onDelete: "set null" },
  ),
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
    artistId: integer("artist_id").references(() => artists.id, {
      onDelete: "cascade",
    }),
    studioId: integer("studio_id").references(() => studios.id, {
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
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
