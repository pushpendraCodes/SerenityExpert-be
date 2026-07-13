import cloudinary, { configureCloudinary } from "../config/cloudinary.js";
import { ValidationError } from "../utils/AppError.js";

configureCloudinary();

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

export async function deleteAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
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
