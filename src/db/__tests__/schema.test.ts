// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  listings,
  listingImages,
  listingsRelations,
  listingImagesRelations,
  listingStatusEnum,
  pipelineStepEnum,
  imageTypeEnum,
} from "../schema";
import { getTableColumns, getTableName } from "drizzle-orm";

describe("listings schema", () => {
  it("should have all required columns", () => {
    const columns = getTableColumns(listings);

    expect(columns.id).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.rawDescription).toBeDefined();
    expect(columns.title).toBeDefined();
    expect(columns.description).toBeDefined();
    expect(columns.suggestedPrice).toBeDefined();
    expect(columns.priceRangeLow).toBeDefined();
    expect(columns.priceRangeHigh).toBeDefined();
    expect(columns.category).toBeDefined();
    expect(columns.condition).toBeDefined();
    expect(columns.brand).toBeDefined();
    expect(columns.model).toBeDefined();
    expect(columns.researchNotes).toBeDefined();
    expect(columns.comparables).toBeDefined();
    expect(columns.status).toBeDefined();
    expect(columns.pipelineStep).toBeDefined();
    expect(columns.pipelineError).toBeDefined();
    expect(columns.inngestRunId).toBeDefined();
    expect(columns.createdAt).toBeDefined();
    expect(columns.updatedAt).toBeDefined();
  });

  it("should have userId as non-nullable", () => {
    const columns = getTableColumns(listings);
    expect(columns.userId.notNull).toBe(true);
  });

  it("should have status defaulting to DRAFT", () => {
    const columns = getTableColumns(listings);
    expect(columns.status.hasDefault).toBe(true);
  });

  it("should have pipelineStep defaulting to PENDING", () => {
    const columns = getTableColumns(listings);
    expect(columns.pipelineStep.hasDefault).toBe(true);
  });

  it("should have createdAt and updatedAt with defaults", () => {
    const columns = getTableColumns(listings);
    expect(columns.createdAt.hasDefault).toBe(true);
    expect(columns.updatedAt.hasDefault).toBe(true);
  });

  it("should have id with a default function (cuid)", () => {
    const columns = getTableColumns(listings);
    expect(columns.id.hasDefault).toBe(true);
    expect(columns.id.name).toBe("id");
  });

  it("should use the 'listings' table name", () => {
    expect(getTableName(listings)).toBe("listings");
  });

  it("should define listings relations with images", () => {
    expect(listingsRelations).toBeDefined();
  });
});

describe("listingImages schema", () => {
  it("should have all required columns", () => {
    const columns = getTableColumns(listingImages);

    expect(columns.id).toBeDefined();
    expect(columns.listingId).toBeDefined();
    expect(columns.type).toBeDefined();
    expect(columns.blobUrl).toBeDefined();
    expect(columns.blobKey).toBeDefined();
    expect(columns.parentImageId).toBeDefined();
    expect(columns.sortOrder).toBeDefined();
    expect(columns.isPrimary).toBeDefined();
    expect(columns.geminiPrompt).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it("should have listingId as non-nullable", () => {
    const columns = getTableColumns(listingImages);
    expect(columns.listingId.notNull).toBe(true);
  });

  it("should have blobUrl and blobKey as non-nullable", () => {
    const columns = getTableColumns(listingImages);
    expect(columns.blobUrl.notNull).toBe(true);
    expect(columns.blobKey.notNull).toBe(true);
  });

  it("should have type defaulting to ORIGINAL", () => {
    const columns = getTableColumns(listingImages);
    expect(columns.type.hasDefault).toBe(true);
  });

  it("should have sortOrder defaulting to 0", () => {
    const columns = getTableColumns(listingImages);
    expect(columns.sortOrder.hasDefault).toBe(true);
  });

  it("should have isPrimary defaulting to false", () => {
    const columns = getTableColumns(listingImages);
    expect(columns.isPrimary.hasDefault).toBe(true);
  });

  it("should have id with a default function (cuid)", () => {
    const columns = getTableColumns(listingImages);
    expect(columns.id.hasDefault).toBe(true);
    expect(columns.id.name).toBe("id");
  });

  it("should use the 'listing_images' table name", () => {
    expect(getTableName(listingImages)).toBe("listing_images");
  });

  it("should define listingImages relations", () => {
    expect(listingImagesRelations).toBeDefined();
  });
});

describe("enums", () => {
  it("should define listing status enum with correct values", () => {
    expect(listingStatusEnum.enumValues).toEqual([
      "DRAFT",
      "PROCESSING",
      "READY",
      "LISTED",
      "SOLD",
      "ARCHIVED",
    ]);
  });

  it("should define pipeline step enum with correct values", () => {
    expect(pipelineStepEnum.enumValues).toEqual([
      "PENDING",
      "ANALYZING",
      "RESEARCHING",
      "GENERATING",
      "COMPLETE",
      "ERROR",
    ]);
  });

  it("should define image type enum with correct values", () => {
    expect(imageTypeEnum.enumValues).toEqual(["ORIGINAL", "ENHANCED"]);
  });
});
