import cloudinary, { configureCloudinary } from "../config/cloudinary.js";
import { ValidationError } from "../utils/AppError.js";
import {
  MAX_FEED_IMAGE_SIZE,
  MAX_FEED_REEL_SIZE,
  MAX_FEED_REEL_DURATION_SEC,
} from "../utils/constants.js";

configureCloudinary();

export type FeedUploadKind = "image" | "video";

function buildUploadSignature(
  type: FeedUploadKind,
  folder: string
) {
  const timestamp = Math.round(Date.now() / 1000);
  // Only sign params that are sent in the upload form (not resource_type — that is the URL path).
  const params: Record<string, string | number> = {
    timestamp,
    folder,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
    resourceType: (type === "video" ? "video" : "image") as "image" | "video",
    maxBytes: type === "video" ? MAX_FEED_REEL_SIZE : MAX_FEED_IMAGE_SIZE,
    maxDurationSec: type === "video" ? MAX_FEED_REEL_DURATION_SEC : undefined,
  };
}

export function getFeedUploadSignature(type: FeedUploadKind, userId: string) {
  const folder =
    type === "image"
      ? `expert-consultant/feed/images/${userId}`
      : `expert-consultant/feed/reels/${userId}`;
  return buildUploadSignature(type, folder);
}

export function getStoryUploadSignature(type: FeedUploadKind, userId: string) {
  const folder = `expert-consultant/stories/${userId}`;
  return buildUploadSignature(type, folder);
}

export function getBannerUploadSignature(type: FeedUploadKind) {
  const folder =
    type === "video"
      ? "expert-consultant/banners/videos"
      : "expert-consultant/banners/images";
  return buildUploadSignature(type, folder);
}

/** Cloudinary video thumbnail URL from a delivery URL / public id */
export function reelThumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [{ width: 720, crop: "limit", quality: "auto" }],
    secure: true,
  });
}

export async function uploadImage(
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `expert-consultant/${folder}`,
        public_id: filename,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(new ValidationError(error?.message || "Upload failed"));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export async function uploadFromUrl(url: string, folder: string): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(url, {
    folder: `expert-consultant/${folder}`,
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function uploadRecording(
  buffer: Buffer,
  callId: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "expert-consultant/recordings",
        public_id: `call_${callId}`,
        resource_type: "video",
      },
      (error, result) => {
        if (error || !result) {
          reject(new ValidationError(error?.message || "Recording upload failed"));
        } else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Extract Cloudinary public_id from a delivery URL.
 * e.g. .../upload/v123/expert-consultant/chat/abc.jpg → expert-consultant/chat/abc
 */
export function publicIdFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const marker = "/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    let path = url.slice(idx + marker.length);
    path = path.split("?")[0].split("#")[0];

    const versionMatch = path.match(/(?:^|\/)v\d+\/(.+)$/);
    if (versionMatch) {
      path = versionMatch[1];
    } else {
      // Skip leading transformation segments (q_auto,f_auto/...)
      const parts = path.split("/");
      while (parts.length > 1 && (parts[0].includes(",") || /^[a-z]+_[^/]+$/.test(parts[0]))) {
        parts.shift();
      }
      path = parts.join("/");
    }

    return path.replace(/\.[a-zA-Z0-9]+$/, "");
  } catch {
    return null;
  }
}

export async function deleteAsset(
  publicId: string,
  resourceType: "image" | "video" | "raw" | "auto" = "image"
): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.warn(`Cloudinary delete failed for ${publicId} (${resourceType}):`, err);
  }
}

export async function deleteAssetByUrl(
  url: string,
  resourceType: "image" | "video" | "raw" | "auto" = "image"
): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  await deleteAsset(publicId, resourceType);
}
