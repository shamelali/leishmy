import { and, eq, notInArray, sql } from "drizzle-orm";
import { bookings } from "@/db/schema";
import type { DbTransaction } from "@/lib/db-utils";

export const TERMINAL_BOOKING_STATUSES = ["cancelled", "rejected"] as const;

export function bookingDateFromInput(date: string): Date {
  // YYYY-MM-DD is stored as UTC midnight so availability checks match inserts.
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * Returns an existing non-terminal booking that occupies the same artist
 * (or studio) + date + time slot, if any.
 */
export async function findConflictingBooking(
  tx: Pick<DbTransaction, "select">,
  input: {
    artistId?: string | null;
    studioId?: string | null;
    date: Date;
    time?: string | null;
  },
): Promise<{ id: number } | null> {
  const conditions = [
    eq(bookings.date, input.date),
    notInArray(bookings.status, [...TERMINAL_BOOKING_STATUSES]),
  ];

  if (input.time) {
    conditions.push(eq(bookings.time, input.time));
  } else {
    conditions.push(sql`${bookings.time} is null`);
  }

  if (input.artistId) {
    conditions.push(eq(bookings.artistId, input.artistId));
  } else if (input.studioId) {
    conditions.push(eq(bookings.studioId, input.studioId));
  }

  const [row] = await tx
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(...conditions))
    .limit(1);

  return row ?? null;
}
