import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { inngest } from "@/inngest/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const listing = await db.query.listings.findFirst({
    where: and(eq(listings.id, id), eq(listings.userId, session.user.id)),
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const body = await request.json();
  const { imageId } = body as { imageId: string };

  if (!imageId) {
    return NextResponse.json(
      { error: "imageId is required" },
      { status: 400 },
    );
  }

  const image = await db.query.listingImages.findFirst({
    where: and(
      eq(listingImages.id, imageId),
      eq(listingImages.listingId, id),
    ),
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  if (image.type !== "ORIGINAL") {
    return NextResponse.json(
      { error: "Can only enhance original images" },
      { status: 400 },
    );
  }

  await inngest.send({
    name: "image.enhance.requested",
    data: {
      imageId,
      listingId: id,
    },
  });

  return NextResponse.json({ status: "processing" });
}
