import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/blob";

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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const files = body.files as FileRequest[] | undefined;

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: "At least one file is required" },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES} files allowed` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.contentType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.contentType}` },
        { status: 400 },
      );
    }
  }

  const sessionId = randomBytes(8).toString("hex");

  const uploads = await Promise.all(
    files.map(async (file) => {
      const suffix = randomBytes(6).toString("hex");
      const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `listings/${sessionId}/${suffix}-${safeName}`;

      return createPresignedUploadUrl(key, file.contentType);
    }),
  );

  return NextResponse.json({ uploads });
}
