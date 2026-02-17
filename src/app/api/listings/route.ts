import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { inngest } from "@/inngest/client";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userListings = await db.query.listings.findMany({
    where: eq(listings.userId, session.user.id),
    orderBy: [desc(listings.createdAt)],
    with: {
      images: true,
    },
  });

  return NextResponse.json(userListings);
}

interface ImageInput {
  key: string;
  url: string;
  filename: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const description = body.description as string | null | undefined;
  const images = body.images as ImageInput[] | undefined;

  if (!images || images.length === 0) {
    return NextResponse.json(
      { error: "At least one image is required" },
      { status: 400 },
    );
  }

  if (images.length > 5) {
    return NextResponse.json(
      { error: "Maximum 5 images allowed" },
      { status: 400 },
    );
  }

  // Create listing record
  const [listing] = await db
    .insert(listings)
    .values({
      userId: session.user.id,
      rawDescription: description ?? null,
      status: "DRAFT",
      pipelineStep: "PENDING",
    })
    .returning();

  // Create image records (images already uploaded to R2)
  const imageRecords = await Promise.all(
    images.map(async (image, index) => {
      const [imageRecord] = await db
        .insert(listingImages)
        .values({
          listingId: listing.id,
          type: "ORIGINAL",
          blobUrl: image.url,
          blobKey: image.key,
          sortOrder: index,
          isPrimary: index === 0,
        })
        .returning();

      return imageRecord;
    }),
  );

  // Trigger AI pipeline
  await inngest.send({
    name: "listing.submitted",
    data: {
      listingId: listing.id,
      imageUrls: imageRecords.map((img) => img.blobUrl),
      userDescription: description ?? null,
    },
  });

  const result = { ...listing, images: imageRecords };
  return NextResponse.json(result, { status: 201 });
}
