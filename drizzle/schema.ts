import {
  pgTable,
  text,
  timestamp,
  foreignKey,
  numeric,
  integer,
  boolean,
  unique,
  serial,
  real,
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const session = pgTable("session", {
  sessionToken: text().primaryKey().notNull(),
  userId: text().notNull(),
  expires: timestamp({ mode: "string" }).notNull(),
});

export const artists = pgTable(
  "artists",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    image: text().notNull(),
    location: text().notNull(),
    area: text().notNull(),
    rating: numeric({ precision: 2, scale: 1 }).default("0").notNull(),
    reviewCount: integer().default(0).notNull(),
    price: numeric({ precision: 10, scale: 2 }).default("0").notNull(),
    bio: text().default("").notNull(),
    portfolio: text().array(),
    available: boolean().default(true).notNull(),
    verified: boolean().default(false).notNull(),
    languages: text().array(),
    responseTime: text().default("Under 1 hour").notNull(),
    slug: text(),
    yearsExperience: integer().default(0),
    featured: boolean().default(false),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    studioId: text(),
    userId: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.studioId],
      foreignColumns: [studios.id],
      name: "artists_studioId_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "artists_userId_fkey",
    }).onDelete("set null"),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    description: text().notNull(),
    image: text().notNull(),
    slug: text(),
  },
  (table) => [unique("categories_slug_unique").on(table.slug)],
);

export const user = pgTable("user", {
  id: text().primaryKey().notNull(),
  name: text(),
  email: text().notNull(),
  emailVerified: timestamp({ mode: "string" }),
  image: text(),
  password: text(),
  phone: text(),
  role: text().default("customer"),
  createdAt: timestamp({ mode: "string" }).defaultNow(),
  updatedAt: timestamp({ mode: "string" }).defaultNow(),
});

export const payouts = pgTable(
  "payouts",
  {
    id: text().primaryKey().notNull(),
    paymentId: text().notNull(),
    muaBankAccountId: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    billplzPaymentOrderId: text(),
    status: text().default("pending").notNull(),
    failureReason: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    completedAt: timestamp({ mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payments.id],
      name: "payouts_paymentId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.muaBankAccountId],
      foreignColumns: [muaBankAccounts.id],
      name: "payouts_muaBankAccountId_fkey",
    }),
  ],
);

export const playingWithNeon = pgTable("playing_with_neon", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  value: real(),
});

export const muaBankAccounts = pgTable(
  "mua_bank_accounts",
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    artistId: text().notNull(),
    bankCode: text().notNull(),
    bankAccountNumber: text().notNull(),
    bankAccountName: text().notNull(),
    identityNumber: text().notNull(),
    isVerified: boolean().default(false),
    isDefault: boolean().default(false),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "mua_bank_accounts_userId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: "mua_bank_accounts_artistId_fkey",
    }).onDelete("cascade"),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: text().primaryKey().notNull(),
    bookingId: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default("MYR"),
    billplzBillId: text(),
    billplzTransactionId: text(),
    billplzPaidAt: text(),
    status: text().default("pending").notNull(),
    heldAt: timestamp({ mode: "string" }),
    releaseScheduledAt: timestamp({ mode: "string" }),
    releasedAt: timestamp({ mode: "string" }),
    paymentMethod: text(),
    failureReason: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    updatedAt: timestamp({ mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.bookingId],
      foreignColumns: [bookings.id],
      name: "payments_bookingId_fkey",
    }).onDelete("cascade"),
  ],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text().primaryKey().notNull(),
  source: text().notNull(),
  type: text().notNull(),
  payload: text().notNull(),
  status: text().default("received"),
  processedAt: timestamp("processed_at", { mode: "string" }),
  error: text(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    artistId: text(),
    studioId: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "favorites_userId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: "favorites_artistId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.studioId],
      foreignColumns: [studios.id],
      name: "favorites_studioId_fkey",
    }).onDelete("cascade"),
  ],
);

export const bookings = pgTable(
  "bookings",
  {
    id: text().primaryKey().notNull(),
    userId: text().notNull(),
    artistId: text().notNull(),
    serviceId: text().notNull(),
    date: text().notNull(),
    time: text().notNull(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    status: text().default("confirmed"),
    paymentStatus: text().default("unpaid"),
    notes: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "bookings_userId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: "bookings_artistId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.serviceId],
      foreignColumns: [services.id],
      name: "bookings_serviceId_fkey",
    }).onDelete("cascade"),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: text().primaryKey().notNull(),
    artistId: text(),
    studioId: text(),
    userId: text(),
    rating: integer().notNull(),
    comment: text(),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    author: text(),
    avatar: text(),
    service: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: "reviews_artistId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.studioId],
      foreignColumns: [studios.id],
      name: "reviews_studioId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "reviews_userId_fkey",
    }).onDelete("cascade"),
  ],
);

export const services = pgTable(
  "services",
  {
    id: text().primaryKey().notNull(),
    artistId: text(),
    studioId: text(),
    name: text().notNull(),
    description: text(),
    price: numeric({ precision: 10, scale: 2 }).notNull(),
    duration: text(),
    category: text(),
    popular: boolean().default(false),
  },
  (table) => [
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: "services_artistId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.studioId],
      foreignColumns: [studios.id],
      name: "services_studioId_fkey",
    }).onDelete("cascade"),
  ],
);

export const studioCategories = pgTable(
  "studio_categories",
  {
    studioId: text().notNull(),
    categoryId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.studioId],
      foreignColumns: [studios.id],
      name: "studio_categories_studioId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "studio_categories_categoryId_fkey",
    }).onDelete("cascade"),
  ],
);

export const artistCategories = pgTable(
  "artist_categories",
  {
    artistId: text().notNull(),
    categoryId: text().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.artistId],
      foreignColumns: [artists.id],
      name: "artist_categories_artistId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "artist_categories_categoryId_fkey",
    }).onDelete("cascade"),
  ],
);

export const studios = pgTable(
  "studios",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    image: text(),
    bio: text(),
    rating: numeric({ precision: 2, scale: 1 }).default("0"),
    reviewCount: integer().default(0),
    location: text(),
    featured: boolean().default(false),
    available: boolean().default(true),
    createdAt: timestamp({ mode: "string" }).defaultNow(),
    area: text(),
    price: numeric({ precision: 10, scale: 2 }).default("0"),
    artistsCount: integer().default(0),
    userId: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "studios_userId_fkey",
    }).onDelete("set null"),
    unique("studios_slug_key").on(table.slug),
  ],
);

export const testimonials = pgTable("testimonials", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  role: text(),
  image: text(),
  quote: text().notNull(),
  rating: integer().default(5),
  featured: boolean().default(false),
  createdAt: timestamp({ mode: "string" }).defaultNow(),
});

export const verificationToken = pgTable(
  "verificationToken",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ mode: "string" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.token, table.identifier],
      name: "verificationToken_identifier_token_pk",
    }),
  ],
);

export const account = pgTable(
  "account",
  {
    userId: text().notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    primaryKey({
      columns: [table.providerAccountId, table.provider],
      name: "account_provider_providerAccountId_pk",
    }),
  ],
);
