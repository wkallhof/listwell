interface ListingForCopy {
  title: string | null;
  suggestedPrice: number | null;
  description: string | null;
}

export function formatListingForClipboard(listing: ListingForCopy): string {
  const parts: string[] = [];

  if (listing.title) {
    parts.push(listing.title);
  }

  if (listing.suggestedPrice != null) {
    parts.push(`$${listing.suggestedPrice}`);
  }

  if (listing.description) {
    if (parts.length > 0) {
      parts.push("");
    }
    parts.push(listing.description);
  }

  return parts.join("\n");
}
