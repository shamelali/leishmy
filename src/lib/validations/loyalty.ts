import { z } from "zod";

export const awardPointsSchema = z.object({
  source: z.string().min(1, "Source is required"),
  referenceId: z.string().max(255).optional(),
  description: z.string().max(500).optional(),
});

export const redeemPointsSchema = z.object({
  amount: z.number().positive("Amount must be positive").int("Amount must be an integer"),
  referenceId: z.string().max(255).optional(),
});
