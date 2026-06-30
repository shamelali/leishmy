import { relations } from "drizzle-orm/relations";
import {
  studios,
  artists,
  user,
  payments,
  payouts,
  muaBankAccounts,
  bookings,
  favorites,
  services,
  reviews,
  studioCategories,
  categories,
  artistCategories,
} from "./schema";

export const artistsRelations = relations(artists, ({ one, many }) => ({
  studio: one(studios, {
    fields: [artists.studioId],
    references: [studios.id],
  }),
  user: one(user, {
    fields: [artists.userId],
    references: [user.id],
  }),
  muaBankAccounts: many(muaBankAccounts),
  favorites: many(favorites),
  bookings: many(bookings),
  reviews: many(reviews),
  services: many(services),
  artistCategories: many(artistCategories),
}));

export const studiosRelations = relations(studios, ({ one, many }) => ({
  artists: many(artists),
  favorites: many(favorites),
  reviews: many(reviews),
  services: many(services),
  studioCategories: many(studioCategories),
  user: one(user, {
    fields: [studios.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  artists: many(artists),
  muaBankAccounts: many(muaBankAccounts),
  favorites: many(favorites),
  bookings: many(bookings),
  reviews: many(reviews),
  studios: many(studios),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  payment: one(payments, {
    fields: [payouts.paymentId],
    references: [payments.id],
  }),
  muaBankAccount: one(muaBankAccounts, {
    fields: [payouts.muaBankAccountId],
    references: [muaBankAccounts.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  payouts: many(payouts),
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const muaBankAccountsRelations = relations(
  muaBankAccounts,
  ({ one, many }) => ({
    payouts: many(payouts),
    user: one(user, {
      fields: [muaBankAccounts.userId],
      references: [user.id],
    }),
    artist: one(artists, {
      fields: [muaBankAccounts.artistId],
      references: [artists.id],
    }),
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  payments: many(payments),
  user: one(user, {
    fields: [bookings.userId],
    references: [user.id],
  }),
  artist: one(artists, {
    fields: [bookings.artistId],
    references: [artists.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(user, {
    fields: [favorites.userId],
    references: [user.id],
  }),
  artist: one(artists, {
    fields: [favorites.artistId],
    references: [artists.id],
  }),
  studio: one(studios, {
    fields: [favorites.studioId],
    references: [studios.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  bookings: many(bookings),
  artist: one(artists, {
    fields: [services.artistId],
    references: [artists.id],
  }),
  studio: one(studios, {
    fields: [services.studioId],
    references: [studios.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  artist: one(artists, {
    fields: [reviews.artistId],
    references: [artists.id],
  }),
  studio: one(studios, {
    fields: [reviews.studioId],
    references: [studios.id],
  }),
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
}));

export const studioCategoriesRelations = relations(
  studioCategories,
  ({ one }) => ({
    studio: one(studios, {
      fields: [studioCategories.studioId],
      references: [studios.id],
    }),
    category: one(categories, {
      fields: [studioCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  studioCategories: many(studioCategories),
  artistCategories: many(artistCategories),
}));

export const artistCategoriesRelations = relations(
  artistCategories,
  ({ one }) => ({
    artist: one(artists, {
      fields: [artistCategories.artistId],
      references: [artists.id],
    }),
    category: one(categories, {
      fields: [artistCategories.categoryId],
      references: [categories.id],
    }),
  }),
);
