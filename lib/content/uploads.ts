import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { ImageRef } from "./types";

// ───────────────────────────────────────────────────────────────────────────
// Editor image uploads (FRONTEND §2.6 imagery). Server-only: it does file IO and
// pulls in the native `sharp` decoder, so importing it from a client module would
// fail the build — that native import is the guard. The composer's publish action
// is the only caller.
//
// The job: turn an author-selected image File into the content model's ImageRef
// (src/alt/width/height). Dimensions are read here, server-side, so the rendered
// cover reserves its box before load → CLS ~0 (FRONTEND §1.3 / §6.2), matching how
// hand-authored covers already carry intrinsic dimensions (lib/content/types.ts).
//
// Storage is a stand-in, exactly like the sample POSTS array: files land under
// public/uploads and are served from disk by `next start`/dev. When the real image
// origin (REBUILD §2 CDN) lands, only persistUpload() changes — it returns a CDN
// URL and the host is added to next.config remotePatterns; nothing else moves.
// ───────────────────────────────────────────────────────────────────────────

/** Cap upload size so a runaway file can't exhaust memory in the action. */
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Accepted image types → the extension we persist under. Kept in lockstep with the
 *  composer's <input accept> so the client and server agree on what's allowed. */
const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export interface UploadError {
  /** Bengali, per-field message (FRONTEND §1.3 forms). */
  error: string;
}

interface DecodedImage {
  buffer: Buffer;
  width: number;
  height: number;
  ext: string;
  mime: string;
}

export function isUploadError(x: unknown): x is UploadError {
  return typeof x === "object" && x !== null && "error" in x;
}

/**
 * Validate + decode an uploaded image. Returns:
 *   • null            — no file chosen (the cover is optional, not an error)
 *   • UploadError     — wrong type / too big / undecodable
 *   • DecodedImage    — a buffer with confirmed intrinsic dimensions
 */
export async function decodeImageUpload(
  file: File | null,
): Promise<DecodedImage | UploadError | null> {
  // A file input with nothing selected still submits an empty File — treat size 0
  // as "no cover" so publishing without an image keeps working.
  if (!file || file.size === 0) return null;

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: "ছবি হতে হবে PNG, JPEG, WebP, AVIF বা GIF ফরম্যাটে।" };
  if (file.size > MAX_BYTES) return { error: "ছবির আকার ৫ মেগাবাইটের কম হতে হবে।" };

  const buffer = Buffer.from(await file.arrayBuffer());

  let width: number | undefined;
  let height: number | undefined;
  try {
    const meta = await sharp(buffer).metadata();
    width = meta.width;
    height = meta.height;
  } catch {
    return { error: "ছবিটি পড়া গেল না — অন্য একটি ছবি দিন।" };
  }
  if (!width || !height) return { error: "ছবির মাপ শনাক্ত করা গেল না।" };

  return { buffer, width, height, ext, mime: file.type };
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Persist a decoded image to public/uploads and return its ImageRef. `baseName`
 * is the new post id, so the file URL is stable and collision-free.
 * CDN-SWAP POINT: replace the write+path here with a CDN upload returning the
 * remote URL (and add the host to next.config remotePatterns).
 */
export async function persistUpload(
  image: DecodedImage,
  alt: string,
  baseName: string,
): Promise<ImageRef> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${baseName}.${image.ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), image.buffer);
  return { src: `/uploads/${fileName}`, alt, width: image.width, height: image.height };
}

/**
 * A throwaway ImageRef for PREVIEW — the image inlined as a data: URL so the author
 * sees the real cover without writing anything to disk (a preview may be clicked
 * many times before publish). next/image serves data: URLs straight through.
 */
export function inlineUpload(image: DecodedImage, alt: string): ImageRef {
  const src = `data:${image.mime};base64,${image.buffer.toString("base64")}`;
  return { src, alt, width: image.width, height: image.height };
}
