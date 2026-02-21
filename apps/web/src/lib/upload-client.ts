export interface UploadedImage {
  key: string;
  url: string;
  filename: string;
}

interface PresignResponse {
  uploads: {
    presignedUrl: string;
    key: string;
    publicUrl: string;
  }[];
}

function uploadFileWithProgress(
  url: string,
  file: File,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        console.error(
          `[upload] PUT failed: status=${xhr.status}, response=${xhr.responseText}`,
        );
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      console.error(
        `[upload] XHR error for ${file.name} — likely CORS. status=${xhr.status}`,
      );
      reject(
        new Error(
          `Upload failed for ${file.name}. Check R2 CORS configuration.`,
        ),
      );
    });

    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(file);
  });
}

export async function uploadImages(
  files: File[],
  onProgress?: (fraction: number) => void,
): Promise<UploadedImage[]> {
  // Request presigned URLs
  const response = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      files: files.map((f) => ({
        filename: f.name,
        contentType: f.type || "image/jpeg",
      })),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to get upload URLs");
  }

  const { uploads } = (await response.json()) as PresignResponse;

  // Track progress per file
  const loaded = new Array(files.length).fill(0);
  const totals = files.map((f) => f.size);
  const totalSize = totals.reduce((sum, s) => sum + s, 0);

  function reportProgress() {
    if (!onProgress) return;
    const totalLoaded = loaded.reduce((sum: number, l: number) => sum + l, 0);
    onProgress(totalSize > 0 ? totalLoaded / totalSize : 1);
  }

  // Upload all files in parallel
  await Promise.all(
    files.map((file, index) =>
      uploadFileWithProgress(
        uploads[index].presignedUrl,
        file,
        (fileLoaded) => {
          loaded[index] = fileLoaded;
          reportProgress();
        },
      ),
    ),
  );

  return files.map((file, index) => ({
    key: uploads[index].key,
    url: uploads[index].publicUrl,
    filename: file.name,
  }));
}
