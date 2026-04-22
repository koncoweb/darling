const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryResponse = {
  secure_url: string;
  public_id: string;
  resource_type: string;
  duration?: number;
  width?: number;
  height?: number;
};

/**
 * Uploads a file to Cloudinary using Unsigned Uploads.
 * @param uri The local file URI (from ImagePicker or Camera)
 * @param resourceType 'image' or 'video'
 * @returns The Cloudinary response object containing secure_url
 */
export async function uploadToCloudinary(
  uri: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<CloudinaryResponse> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing in .env');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const formData = new FormData();
  
  // React Native requires a special object for file uploads in FormData
  const fileData = {
    uri: uri,
    type: resourceType === 'video' ? 'video/mp4' : 'image/jpeg',
    name: resourceType === 'video' ? 'upload.mp4' : 'upload.jpg',
  };

  formData.append('file', fileData as any);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudinary upload error:', errorText);
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Generates a thumbnail URL for a Cloudinary video URL.
 * @param videoUrl The secure_url returned by Cloudinary
 * @returns A URL for the converted thumbnail image
 */
export function getVideoThumbnail(videoUrl: string): string {
  if (!videoUrl) return '';
  
  // Cloudinary allows generating images from videos by simply changing the extension.
  // We specify so_0 (start_offset: 0) to get the first frame.
  // We also ensure it's converted to jpg.
  if (videoUrl.includes('/upload/')) {
    return videoUrl.replace('/upload/', '/upload/so_0/').replace(/\.[^/.]+$/, '.jpg');
  }
  
  return videoUrl.replace(/\.[^/.]+$/, '.jpg');
}
