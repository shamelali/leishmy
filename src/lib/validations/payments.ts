import { z } from "zod";

export const createBillSchema = z.object({
  bookingId: z.number().positive("bookingId is required"),
  description: z.string().max(500).optional(),
  name: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  idempotencyKey: z.string().max(255).optional(),
});

export const createRemainingBillSchema = z.object({
  bookingId: z.number().positive("bookingId is required"),
  idempotencyKey: z.string().max(255).optional(),
});

export const registerBankSchema = z.object({
  userId: z.string().min(1),
  bankName: z.string().min(1, "Bank name is required").max(255),
  bankCode: z.string().max(20).optional(),
  accountNumber: z.string().min(1, "Account number is required").max(100),
  accountHolder: z.string().min(1, "Account holder is required").max(255),
});

export const qrPaymentSchema = z.object({
  bookingId: z.number().positive("bookingId is required"),
});

export const releasePaymentSchema = z.object({
  paymentId: z.number().positive("paymentId is required"),
});

export const refundPaymentSchema = z.object({
  paymentId: z.number().positive("paymentId is required"),
});
