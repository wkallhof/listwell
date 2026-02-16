import { put, del } from "@vercel/blob";

interface UploadResult {
  url: string;
  key: string;
}

export async function uploadImage(
  file: File,
  listingId: string,
): Promise<UploadResult> {
  const blob = await put(`listings/${listingId}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    key: blob.pathname,
  };
}

export async function deleteImage(blobUrl: string): Promise<void> {
  await del(blobUrl);
}

export async function deleteImages(blobUrls: string[]): Promise<void> {
  if (blobUrls.length === 0) return;
  await del(blobUrls);
}
