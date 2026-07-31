import { z } from "zod";

export const createBookingSchema = z.object({
  artistId: z.union([z.string(), z.number()]).optional(),
  studioId: z.union([z.string(), z.number()]).optional(),
  serviceId: z.number().positive().optional(),
  service: z.string().max(255).optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
  placeId: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
  clientEmail: z.string().email().optional(),
  clientName: z.string().max(255).optional(),
  // No fees - MUA adds them later
});

export const updateBookingSchema = z.object({
  id: z.number().positive(),
  status: z.enum(["cancelled"]),
});

export const updateBookingPriceSchema = z.object({
  id: z.number().positive(),
  amount: z.number().nonnegative().optional(),
  depositAmount: z.number().nonnegative().optional(),
  travelSurcharge: z.number().nonnegative().optional(),
  accommodationFee: z.number().nonnegative().optional(),
});

export const addQuoteSchema = z.object({
  bookingId: z.number().positive(),
  servicePrice: z.number().nonnegative(),
  accommodationFee: z.number().nonnegative().optional().default(0),
  travelFee: z.number().nonnegative().optional().default(0),
  notes: z.string().max(2000).optional(),
});

export const acceptQuoteSchema = z.object({
  bookingId: z.number().positive(),
});

export const rejectQuoteSchema = z.object({
  bookingId: z.number().positive(),
});
