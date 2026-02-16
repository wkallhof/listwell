import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { deleteImages } from "@/lib/blob";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const listing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, session.user.id)),
    with: {
      images: true,
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, session.user.id)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;

  // Only allow updating specific fields
  const allowedFields = [
    "title",
    "description",
    "suggestedPrice",
    "status",
    "rawDescription",
    "category",
    "condition",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(listings)
    .set(updates)
    .where(eq(listings.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership and get images for blob cleanup
  const existing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, session.user.id)),
    with: {
      images: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Delete blobs
  const blobUrls = existing.images.map((img) => img.blobUrl);
  await deleteImages(blobUrls);

  // Delete listing (cascade deletes images)
  await db.delete(listings).where(eq(listings.id, id));

  return NextResponse.json({ success: true });
}
