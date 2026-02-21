import { Hono } from "hono";
import { randomBytes } from "crypto";
import { requireAuth } from "../middleware/auth";
import { createPresignedUploadUrl } from "../lib/blob";

const MAX_FILES = 5;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

interface FileRequest {
  filename: string;
  contentType: string;
}

export const uploadRoutes = new Hono();

uploadRoutes.use(requireAuth);

uploadRoutes.post("/upload/presign", async (c) => {
  const body = await c.req.json();
  const files = body.files as FileRequest[] | undefined;

  if (!files || files.length === 0) {
    return c.json({ error: "At least one file is required" }, 400);
  }

  if (files.length > MAX_FILES) {
    return c.json({ error: `Maximum ${MAX_FILES} files allowed` }, 400);
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.contentType)) {
      return c.json(
        { error: `Unsupported file type: ${file.contentType}` },
        400,
      );
    }
  }

  const sessionId = randomBytes(8).toString("hex");

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        const suffix = randomBytes(6).toString("hex");
        const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
        const key = `listings/${sessionId}/${suffix}-${safeName}`;

        return createPresignedUploadUrl(key, file.contentType);
      }),
    );

    console.log(
      `[presign] Generated ${uploads.length} presigned URL(s) for session ${sessionId}`,
    );

    return c.json({ uploads });
  } catch (err) {
    console.error("[presign] Failed to generate presigned URLs:", err);
    return c.json({ error: "Failed to generate upload URLs" }, 500);
  }
});
