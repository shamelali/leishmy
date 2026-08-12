import { z } from "zod";

const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;
const PHONE = /^$|^[+\d\s\-()]+$/;

function todayYmdUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export const createBookingSchema = z
  .object({
    artistId: z.union([z.string().min(1).max(128), z.number().int().positive()]).optional(),
    studioId: z.union([z.string().min(1).max(128), z.number().int().positive()]).optional(),
    serviceId: z.number().int().positive().optional(),
    service: z.string().max(255).optional(),
    date: z
      .string()
      .regex(DATE_YMD, "Date must be YYYY-MM-DD")
      .refine((value) => value >= todayYmdUtc(), {
        message: "Booking date must be today or in the future",
      }),
    time: z.string().min(1).max(50).optional(),
    notes: z.string().max(2000).optional(),
    location: z.string().max(255).optional(),
    placeId: z.string().max(255).optional(),
    phone: z.string().max(20).regex(PHONE, "Invalid phone").optional(),
    clientPhone: z.string().max(20).regex(PHONE, "Invalid phone").optional(),
    clientEmail: z.string().email().optional(),
    clientName: z.string().max(255).optional(),
  })
  .refine((data) => data.artistId != null || data.studioId != null, {
    message: "artistId or studioId is required",
    path: ["artistId"],
  });

export const updateBookingSchema = z.object({
  id: z.number().positive(),
  status: z.enum(["cancelled", "completed", "in_progress"]),
});

export const updateBookingPriceSchema = z.object({
  id: z.number().positive(),
  amount: z.number().positive().optional(),
  depositAmount: z.number().nonnegative().optional(),
  travelSurcharge: z.number().nonnegative().optional(),
  accommodationFee: z.number().nonnegative().optional(),
});

export const addQuoteSchema = z.object({
  bookingId: z.number().positive(),
  servicePrice: z.number().positive(),
  accommodationFee: z.number().nonnegative().optional().default(0),
  travelFee: z.number().nonnegative().optional().default(0),
  // MYR amount (UI sends ringgit, not a 0–50 percent). Route caps at 50% of total.
  discount: z.number().nonnegative().optional().default(0),
  discountReason: z.string().max(255).optional(),
  extras: z
    .array(z.object({ name: z.string().max(255), price: z.number().nonnegative() }))
    .optional()
    .default([]),
  packageId: z.number().positive().optional(),
  packageName: z.string().max(255).optional(),
  depositPercent: z.number().min(10).max(100).optional().default(30),
  notes: z.string().max(2000).optional(),
});

export const acceptQuoteSchema = z.object({
  bookingId: z.number().positive(),
});

export const rejectQuoteSchema = z.object({
  bookingId: z.number().positive(),
});
