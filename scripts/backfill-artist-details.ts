import "dotenv/config";
import { db } from "../src/db";
import { profiles, users } from "../src/db/schema";
import { eq, and, isNull, or, sql } from "drizzle-orm";

async function backfillArtistDetails() {
  console.log("Backfilling artist profile details from registration data...\n");

  const artistProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.role, "artist"));

  console.log(`Found ${artistProfiles.length} artist profiles`);

  let updated = 0;
  let skipped = 0;

  for (const profile of artistProfiles) {
    const needsSpecialties =
      !profile.specialties || (profile.specialties as string[]).length === 0;
    const needsLocation = !profile.area && !profile.district;

    if (!needsSpecialties && !needsLocation) {
      skipped++;
      continue;
    }

    const [userRow] = await db
      .select({ location: users.location })
      .from(users)
      .where(eq(users.id, profile.userId))
      .limit(1);

    const updateData: Record<string, unknown> = {};

    if (needsSpecialties && profile.categories && (profile.categories as string[]).length > 0) {
      updateData.specialties = profile.categories;
    }

    if (needsLocation && userRow?.location) {
      const [district, area] = userRow.location.split(", ");
      if (district) updateData.district = district;
      if (area) updateData.area = area;
      else if (!district) updateData.area = userRow.location;
    }

    if (Object.keys(updateData).length === 0) {
      skipped++;
      continue;
    }

    await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.userId, profile.userId));

    updated++;
    console.log(
      `  updated ${profile.userId} -> specialties=${(updateData.specialties as string[] | undefined)?.length ?? 0}, district=${updateData.district ?? "-"}, area=${updateData.area ?? "-"}`,
    );
  }

  console.log(`\nDone. updated=${updated}, skipped=${skipped}`);
}

backfillArtistDetails()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
