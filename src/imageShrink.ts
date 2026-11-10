// Shrinks large images in the browser so they fit under a size limit before upload.
// Small images, GIFs and SVGs are returned unchanged.

export const IMAGE_LIMIT_BYTES = 1024 * 1024;
const MAX_SIDE = 2000;
const QUALITIES = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

function encode(source: ImageBitmap, width: number, height: number, quality: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  // JPEG has no transparency, so transparent PNG areas become white.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function shrinkImage(file: File, limit = IMAGE_LIMIT_BYTES): Promise<File> {
  if (file.size <= limit || !file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    for (let round = 0; round < 6; round++) {
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      for (const quality of QUALITIES) {
        const blob = await encode(bitmap, width, height, quality);
        if (blob && blob.size <= limit) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
      }
      scale *= 0.75;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("Could not shrink the image under the limit");
}

// Course banners follow the common course-platform standard:
// 16:9, resized to at most 1600 × 900 px and compressed under 500 KB.
export const BANNER_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const BANNER_MIN = { width: 750, height: 422 };
const BANNER_TARGET = { width: 1600, height: 900 };
const BANNER_LIMIT_BYTES = 500 * 1024;

function encodeBanner(source: ImageBitmap, crop: { x: number; y: number; w: number; h: number }, width: number, height: number, type: string, quality: number): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareBanner(file: File): Promise<{ file: File; lowRes: boolean }> {
  const bitmap = await createImageBitmap(file);
  try {
    const lowRes = bitmap.width < BANNER_MIN.width || bitmap.height < BANNER_MIN.height;
    // Center crop to 16:9.
    const ratio = 16 / 9;
    const crop = bitmap.width / bitmap.height > ratio
      ? { w: Math.round(bitmap.height * ratio), h: bitmap.height }
      : { w: bitmap.width, h: Math.round(bitmap.width / ratio) };
    const area = { ...crop, x: Math.round((bitmap.width - crop.w) / 2), y: Math.round((bitmap.height - crop.h) / 2) };
    // Never enlarge, only shrink.
    let scale = Math.min(1, BANNER_TARGET.width / area.w);
    for (let round = 0; round < 5; round++) {
      const width = Math.max(1, Math.round(area.w * scale));
      const height = Math.max(1, Math.round(area.h * scale));
      for (const quality of [0.86, 0.8, 0.74, 0.68, 0.6]) {
        // WebP is smaller. Browsers that can't make WebP give back another type, so JPEG is used then.
        let blob = await encodeBanner(bitmap, area, width, height, "image/webp", quality);
        if (!blob || blob.type !== "image/webp") blob = await encodeBanner(bitmap, area, width, height, "image/jpeg", quality);
        if (blob && blob.size <= BANNER_LIMIT_BYTES) {
          const ext = blob.type === "image/webp" ? "webp" : "jpg";
          return { file: new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${ext}`, { type: blob.type }), lowRes };
        }
      }
      scale *= 0.8;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("Could not compress the banner");
}
