import { z } from "zod";

export const createReviewSchema = z.object({
  author: z.string().min(1, "Author is required").max(255),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  text: z.string().max(2000).optional(),
  service: z.string().max(255).optional(),
  artistId: z.string().optional(),
  studioId: z.string().optional(),
  userId: z.string().optional(),
});
