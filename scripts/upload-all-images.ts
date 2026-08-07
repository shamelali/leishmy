import "dotenv/config";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";
import fs from "fs";
import path from "path";

const imagesDir = path.resolve(process.cwd(), "public/images");
const files = fs.readdirSync(imagesDir).filter(file => 
  /\.(jpe?g|png|gif|webp)$/i.test(file)
);

console.log(`Found ${files.length} images in ${imagesDir}`);

async function uploadImage(fileName: string, folder?: string): Promise<string> {
  const filePath = path.join(imagesDir, fileName);
  console.log(`Uploading ${fileName}...`);
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    use_filename: true,
    unique_filename: false,
    overwrite: true,
  });
  console.log(`Uploaded: ${result.secure_url}`);
  return result.secure_url;
}

async function setHeroBgImage(url: string) {
  const [existing] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, "hero_bg_image"))
    .limit(1);

  if (existing) {
    await db
      .update(adminSettings)
      .set({ value: url })
      .where(eq(adminSettings.key, "hero_bg_image"));
    console.log(`Updated hero_bg_image to ${url}`);
  } else {
    await db.insert(adminSettings).values({
      key: "hero_bg_image",
      value: url,
    });
    console.log(`Inserted hero_bg_image = ${url}`);
  }
}

(async () => {
  if (files.length === 0) {
    console.log("No images to upload.");
    return;
  }

  // Upload all images to root folder (no folder)
  const uploadPromises = files.map(file => uploadImage(file, undefined));
  const urls = await Promise.all(uploadPromises);
  console.log("All images uploaded to root.");

  // Optionally, set hero background to the first image (if not already set)
  const firstFile = files[0];
  const firstUrl = urls[0];
  await setHeroBgImage(firstUrl);

  console.log("Done.");
})().catch(err => {
  console.error(err);
  process.exit(1);
});