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
  accommodationFee: z.boolean().optional(),
  travelSurcharge: z.boolean().optional(),
});

export const updateBookingSchema = z.object({
  id: z.number().positive(),
  status: z.enum(["cancelled"]),
});
