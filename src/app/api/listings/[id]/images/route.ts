import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { deleteImage } from "@/lib/blob";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: listingId } = await params;

  // Verify listing ownership
  const listing = await db.query.listings.findFirst({
    where: and(
      eq(listings.id, listingId),
      eq(listings.userId, session.user.id),
    ),
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json(
      { error: "imageId query parameter is required" },
      { status: 400 },
    );
  }

  // Find the image and verify it belongs to this listing
  const image = await db.query.listingImages.findFirst({
    where: and(
      eq(listingImages.id, imageId),
      eq(listingImages.listingId, listingId),
    ),
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Only allow deleting ENHANCED images
  if (image.type !== "ENHANCED") {
    return NextResponse.json(
      { error: "Cannot delete original images" },
      { status: 400 },
    );
  }

  // Delete from blob storage
  await deleteImage(image.blobUrl);

  // Delete from database
  await db.delete(listingImages).where(eq(listingImages.id, imageId));

  return NextResponse.json({ success: true });
}
