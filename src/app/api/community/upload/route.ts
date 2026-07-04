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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match expected type" },
        { status: 400 },
      );
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "community-applications",
          allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf"],
          max_file_size: MAX_SIZE,
          transformation: [{ quality: "auto", fetch_format: "auto" }],
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
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
