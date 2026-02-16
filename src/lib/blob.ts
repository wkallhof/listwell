import { randomBytes } from "crypto";
import { extname } from "path";

// --- Provider Interface ---

interface UploadResult {
  url: string;
  key: string;
}

interface UploadOptions {
  contentType?: string;
  addRandomSuffix?: boolean;
}

interface StorageProvider {
  upload(
    path: string,
    data: File | Buffer,
    options: UploadOptions,
  ): Promise<UploadResult>;
  delete(url: string): Promise<void>;
  deleteMany(urls: string[]): Promise<void>;
}

// --- Vercel Blob Provider ---

function createVercelBlobProvider(): StorageProvider {
  return {
    async upload(path, data, options) {
      const { put } = await import("@vercel/blob");
      const blob = await put(path, data, {
        access: "public",
        contentType: options.contentType,
        addRandomSuffix: options.addRandomSuffix ?? true,
      });
      return { url: blob.url, key: blob.pathname };
    },
    async delete(url) {
      const { del } = await import("@vercel/blob");
      await del(url);
    },
    async deleteMany(urls) {
      const { del } = await import("@vercel/blob");
      await del(urls);
    },
  };
}

// --- Cloudflare R2 Provider ---

function getR2Config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!accountId || !bucket || !publicUrl) {
    throw new Error(
      "Missing R2 configuration. Set CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, and R2_PUBLIC_URL.",
    );
  }

  return { accountId, bucket, publicUrl };
}

function addR2RandomSuffix(key: string): string {
  const ext = extname(key);
  const base = key.slice(0, -ext.length || undefined);
  const suffix = randomBytes(8).toString("hex");
  return `${base}-${suffix}${ext}`;
}

function createR2Provider(): StorageProvider {
  const { accountId, bucket, publicUrl } = getR2Config();

  function extractKey(url: string): string {
    return url.replace(`${publicUrl}/`, "");
  }

  async function getClient() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  return {
    async upload(path, data, options) {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await getClient();
      const key =
        options.addRandomSuffix !== false ? addR2RandomSuffix(path) : path;

      let body: Buffer;
      if (Buffer.isBuffer(data)) {
        body = data;
      } else {
        const arrayBuffer = await (data as File).arrayBuffer();
        body = Buffer.from(arrayBuffer);
      }

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: options.contentType ?? "application/octet-stream",
        }),
      );

      return { url: `${publicUrl}/${key}`, key };
    },

    async delete(url) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const client = await getClient();
      const key = extractKey(url);
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
      );
    },

    async deleteMany(urls) {
      const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
      const client = await getClient();
      const objects = urls.map((url) => ({ Key: extractKey(url) }));
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects },
        }),
      );
    },
  };
}

// --- Factory ---

type ProviderName = "vercel-blob" | "r2";

let cachedProvider: StorageProvider | null = null;
let cachedProviderName: ProviderName | null = null;

function getProviderName(): ProviderName {
  const env = process.env.STORAGE_PROVIDER;
  if (env === "r2") return "r2";
  return "vercel-blob";
}

export function getProvider(): StorageProvider {
  const name = getProviderName();
  if (cachedProvider && cachedProviderName === name) {
    return cachedProvider;
  }

  cachedProvider =
    name === "r2" ? createR2Provider() : createVercelBlobProvider();
  cachedProviderName = name;
  return cachedProvider;
}

// Exposed for testing — allows resetting the cached provider
export function _resetProviderCache(): void {
  cachedProvider = null;
  cachedProviderName = null;
}

// --- Exported API (unchanged signatures + new uploadBuffer) ---

export async function uploadImage(
  file: File,
  listingId: string,
): Promise<UploadResult> {
  const provider = getProvider();
  return provider.upload(`listings/${listingId}/${file.name}`, file, {
    addRandomSuffix: true,
  });
}

export async function uploadBuffer(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<UploadResult> {
  const provider = getProvider();
  return provider.upload(path, buffer, {
    contentType,
    addRandomSuffix: true,
  });
}

export async function deleteImage(blobUrl: string): Promise<void> {
  const provider = getProvider();
  return provider.delete(blobUrl);
}

export async function deleteImages(blobUrls: string[]): Promise<void> {
  if (blobUrls.length === 0) return;
  const provider = getProvider();
  return provider.deleteMany(blobUrls);
}

export type { UploadResult, StorageProvider };
