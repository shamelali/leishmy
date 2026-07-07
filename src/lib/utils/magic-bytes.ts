/**
 * Magic-byte validation for image uploads.
 *
 * This is a defense-in-depth check on top of:
 *  - The MIME type declared by the browser
 *  - Cloudinary's server-side `allowed_formats` enforcement (baked into the signature)
 *
 * It is intentionally simple: read the first N bytes of the file and compare
 * to known signatures. HEIC/HEIF detection is delegated to Cloudinary because
 * its brand box structure is more variable than other formats.
 */

export type SupportedImageKind = "jpeg" | "png" | "webp" | "gif" | "heic" | "unknown";

const SIGNATURES: Array<{ kind: Exclude<SupportedImageKind, "heic" | "unknown">; bytes: number[] }> = [
  { kind: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { kind: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { kind: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { kind: "webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF — full WEBP check verifies "WEBP" at offset 8
];

/**
 * Read the first `n` bytes of a File as a Uint8Array.
 * Throws if the file is empty or unreadable.
 */
export async function readFileHead(file: File, n: number): Promise<Uint8Array> {
  if (file.size === 0) {
    throw new Error("File is empty");
  }
  const slice = file.slice(0, Math.min(n, file.size));
  return new Uint8Array(await slice.arrayBuffer());
}

function bytesMatch(head: Uint8Array, signature: number[]): boolean {
  if (head.length < signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (head[i] !== signature[i]) return false;
  }
  return true;
}

function isWebp(head: Uint8Array): boolean {
  if (!bytesMatch(head, SIGNATURES.find((s) => s.kind === "webp")!.bytes)) {
    return false;
  }
  // RIFF....WEBP — bytes 8–11 must spell "WEBP"
  if (head.length < 12) return false;
  return (
    head[8] === 0x57 && // W
    head[9] === 0x45 && // E
    head[10] === 0x42 && // B
    head[11] === 0x50 // P
  );
}

function isHeic(head: Uint8Array): boolean {
  // ISO BMFF: bytes 4–7 must be "ftyp" (66 74 79 70)
  if (head.length < 12) return false;
  if (
    head[4] !== 0x66 ||
    head[5] !== 0x74 ||
    head[6] !== 0x79 ||
    head[7] !== 0x70
  ) {
    return false;
  }
  // Major brand at 8–11 must indicate HEIC family
  const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
  return ["heic", "heix", "heim", "heis", "mif1", "msf1", "hevc", "hevx"].includes(brand);
}

/**
 * Detect image kind from the first 12 bytes. Returns "unknown" if the
 * signature does not match any known format.
 */
export function detectImageKind(head: Uint8Array): SupportedImageKind {
  for (const { kind, bytes } of SIGNATURES) {
    if (bytesMatch(head, bytes)) {
      if (kind === "webp") return isWebp(head) ? "webp" : "unknown";
      return kind;
    }
  }
  if (isHeic(head)) return "heic";
  return "unknown";
}

/**
 * Validate a File's declared MIME type against its actual content.
 * Returns null on success, or a human-readable error message on failure.
 *
 * Note: HEIC/HEIF is intentionally skipped here — its brand structure is
 * variable. Cloudinary's server-side `allowed_formats` enforcement catches
 * mismatches for HEIC. Client-side we still check the declared MIME.
 */
export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return "File is empty";
  if (file.size > 10 * 1024 * 1024) return "File is too large. Max 10 MB.";

  const mime = file.type.toLowerCase();

  // Cloudinary will accept what we tell it. We allowlist the same formats
  // the server signs, so the user gets a fast, friendly error before any
  // network request happens.
  const allowedMimes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
  ]);
  if (!allowedMimes.has(mime)) {
    return "Only JPEG, PNG, WEBP, GIF, or HEIC images are allowed.";
  }

  // Skip magic-byte check for HEIC/HEIF — variable brand bytes make this
  // unreliable client-side. Cloudinary enforces content-based filtering.
  if (mime === "image/heic" || mime === "image/heif") {
    return null;
  }

  let head: Uint8Array;
  try {
    head = await readFileHead(file, 12);
  } catch {
    return "Could not read file contents.";
  }

  const kind = detectImageKind(head);
  if (kind === "unknown") {
    return "File contents do not match the declared image type.";
  }

  // Cross-check detected kind against declared MIME
  const expected: Record<string, SupportedImageKind> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  if (expected[mime] && expected[mime] !== kind) {
    return `File appears to be ${kind.toUpperCase()} but was declared as ${mime}.`;
  }

  return null;
}
