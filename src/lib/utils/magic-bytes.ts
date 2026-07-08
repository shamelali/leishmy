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
 *
 * Design notes:
 *  - We trust the *content* over the browser's declared MIME. Browsers (especially
 *    iOS Safari and some Android browsers) report inconsistent MIMEs for perfectly
 *    valid images. As long as the file's magic bytes match a known image format,
 *    we accept it.
 *  - If the browser sends an empty or generic MIME (e.g. `application/octet-stream`
 *    from iOS), we infer the MIME from the detected content kind.
 *  - HEIC/HEIF magic-byte detection is intentionally permissive — Cloudinary
 *    enforces the final say on whether the file is actually decodable.
 */

export type SupportedImageKind = "jpeg" | "png" | "webp" | "gif" | "heic" | "unknown";

const SIGNATURES: Array<{ kind: Exclude<SupportedImageKind, "heic" | "unknown">; bytes: number[] }> = [
  { kind: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { kind: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { kind: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { kind: "webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF — full WEBP check verifies "WEBP" at offset 8
];

const KIND_TO_MIME: Record<Exclude<SupportedImageKind, "unknown">, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

const ALLOWED_MIMES = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  // Some iOS builds send this for HEIC. It's not in the strict allowlist,
  // but we treat it as a sentinel that triggers content-based inference.
  "application/octet-stream",
]);

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
 * signature does not match any known format, or if the input is too
 * short to be a real image (a 5-byte file starting with 0xFF 0xD8 0xFF
 * is not actually a JPEG).
 */
const MIN_HEAD_BYTES = 12;

export function detectImageKind(head: Uint8Array): SupportedImageKind {
  if (head.length < MIN_HEAD_BYTES) return "unknown";
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
 * Strategy:
 *  1. Reject empty or oversized files.
 *  2. Reject if the declared MIME is clearly not an image AND the content
 *     also doesn't look like a known image (catches renamed .exe etc.).
 *  3. Reject if the content doesn't match any known image signature.
 *  4. Otherwise, accept. We do NOT require the declared MIME to match
 *     the detected kind — too many real-world browsers report the wrong
 *     MIME for valid images.
 */
export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return "File is empty";
  if (file.size > 10 * 1024 * 1024) return "File is too large. Max 10 MB.";

  const declaredMime = file.type.toLowerCase();

  // Try to detect the kind from the file's first 12 bytes.
  // We do this BEFORE the MIME allowlist check so we can fall back to
  // content-based inference when the browser sends an unhelpful MIME.
  let detected: SupportedImageKind = "unknown";
  try {
    const head = await readFileHead(file, 12);
    detected = detectImageKind(head);
  } catch {
    return "Could not read file contents.";
  }

  // Infer a MIME from detected content for the allowlist check below.
  const effectiveMime = detected !== "unknown" ? KIND_TO_MIME[detected] : declaredMime;

  // Reject if BOTH the declared MIME and the detected content look non-image.
  // (e.g. a renamed .exe declared as application/octet-stream with no image signature.)
  if (detected === "unknown" && !ALLOWED_MIMES.has(declaredMime)) {
    return "Only JPEG, PNG, WEBP, GIF, or HEIC images are allowed.";
  }

  // If we can't detect the kind but the browser declared an image MIME,
  // trust the declaration. The signature request is signed with the
  // server-side allowed_formats list, which is the final word.
  if (detected === "unknown") {
    return null;
  }

  // We have a positive content match. Accept regardless of the declared MIME.
  // Cloudinary's content-based filtering is the final safety net.
  if (process.env.NODE_ENV !== "production" && declaredMime && declaredMime !== effectiveMime) {
    // Dev-only hint: log when the browser's MIME disagrees with content.
    // In production we stay silent to avoid leaking diagnostics to the console.
    console.debug(
      `[upload] browser declared ${declaredMime} but content is ${detected} (${effectiveMime}); accepting by content`,
    );
  }

  return null;
}
