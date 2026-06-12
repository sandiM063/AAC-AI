import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 2 * 1024 * 1024;

export function getAvatarFilePath(userId: string) {
  return path.join(AVATAR_DIR, `${userId}.jpg`);
}

export async function ensureAvatarDir() {
  await mkdir(AVATAR_DIR, { recursive: true });
}

export async function saveAvatarFile(userId: string, bytes: Buffer) {
  await ensureAvatarDir();
  await writeFile(getAvatarFilePath(userId), bytes);
}

export async function readAvatarFile(userId: string) {
  try {
    return await readFile(getAvatarFilePath(userId));
  } catch {
    return null;
  }
}

export async function deleteAvatarFile(userId: string) {
  try {
    await unlink(getAvatarFilePath(userId));
  } catch {
    // File may not exist.
  }
}

export function validateAvatarBuffer(bytes: Buffer, contentType: string) {
  if (!ALLOWED_TYPES.has(contentType)) {
    return "Please upload a JPEG, PNG, or WebP image.";
  }
  if (bytes.byteLength > MAX_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}
