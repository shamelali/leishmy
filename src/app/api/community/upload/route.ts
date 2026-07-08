import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const sigs = MAGIC_BYTES[mimeType];
  if (!sigs) return false;
  return sigs.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

const MAX_SIZE = 10 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return jsonError("Upload service is not configured", 500);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return jsonError("No file provided", 400);
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return jsonError("Invalid file type. Use JPEG, PNG, WEBP, or PDF.", 400);
    }

    if (file.size > MAX_SIZE) {
      return jsonError("File too large. Max 10MB.", 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return jsonError("File content does not match expected type", 400);
    }

    // NOTE: we deliberately do NOT include a `transformation` here. Doing so
    // forces Cloudinary to run the transform synchronously during upload,
    // which can fail the whole upload on unusual inputs. Format/quality
    // negotiation is handled on delivery by Cloudinary's CDN (f_auto/q_auto
    // applied to the returned URL on fetch).
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "community-applications",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf"],
          max_file_size: MAX_SIZE,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as { secure_url: string });
        },
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    // Surface the actual Cloudinary error so users (and we) can see why
    // the upload failed. Without this, every failure looks the same.
    console.error("Community upload error:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
