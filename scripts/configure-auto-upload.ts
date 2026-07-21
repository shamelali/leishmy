import cloudinary from "@/lib/cloudinary";
import { prefixedEnvReader } from "@/lib/env-prefix";

const cld = prefixedEnvReader("CLOUDINARY_");
const cloudName = cld.get("CLOUD_NAME");
const apiKey = cld.get("API_KEY");
const apiSecret = cld.get("API_SECRET");

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary credentials");
  process.exit(1);
}

async function configureAutoUpload() {
  console.log(`Configuring auto-upload for cloud: ${cloudName}`);

  try {
    const result = await cloudinary.api.create_upload_mapping(
      "leish-auto",
      {
        template: "https://res.cloudinary.com/{cloud_name}/image/fetch/{asset_path}",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "heic"],
      }
    );

    console.log("Upload mapping created:", result);
  } catch (error: any) {
    if (error?.error?.message?.includes("already exists")) {
      console.log("Upload mapping 'leish-auto' already exists");
    } else {
      console.error("Failed to create upload mapping:", error);
      throw error;
    }
  }

  try {
    const result = await cloudinary.api.create_upload_mapping(
      "leish-portfolio",
      {
        template: "https://res.cloudinary.com/{cloud_name}/image/upload/{asset_path}",
        folder: "leish/users/{user_id}/artist/portfolio",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "heic"],
        transformation: "f_auto,q_auto,w_1200",
      }
    );

    console.log("Portfolio upload mapping created:", result);
  } catch (error: any) {
    if (error?.error?.message?.includes("already exists")) {
      console.log("Upload mapping 'leish-portfolio' already exists");
    } else {
      console.error("Failed to create portfolio upload mapping:", error);
      throw error;
    }
  }

  console.log("\nDone! Configure these in Cloudinary Dashboard > Settings > Upload > Upload Mappings:");
  console.log("- leish-auto: Auto-fetch external images");
  console.log("- leish-portfolio: Direct portfolio uploads with transformations");
}

configureAutoUpload().catch(console.error);