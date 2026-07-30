import { z } from "zod";

export const createInquirySchema = z.object({
  artistId: z.string().min(1, "Artist ID is required").or(z.number().positive()),
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20).optional(),
  location: z.string().max(255).optional(),
  message: z.string().min(1, "Message is required").max(5000),
});
