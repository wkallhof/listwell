import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { listings, listingImages } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { uploadImage } from "@/lib/blob";

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

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const description = formData.get("description") as string | null;
  const files = formData.getAll("images") as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { error: "At least one image is required" },
      { status: 400 },
    );
  }

  if (files.length > 5) {
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
      rawDescription: description,
      status: "DRAFT",
      pipelineStep: "PENDING",
    })
    .returning();

  // Upload images and create records
  const imageRecords = await Promise.all(
    files.map(async (file, index) => {
      const { url, key } = await uploadImage(file, listing.id);

      const [imageRecord] = await db
        .insert(listingImages)
        .values({
          listingId: listing.id,
          type: "ORIGINAL",
          blobUrl: url,
          blobKey: key,
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
      userDescription: description,
    },
  });

  const result = { ...listing, images: imageRecords };
  return NextResponse.json(result, { status: 201 });
}
