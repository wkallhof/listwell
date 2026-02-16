interface ListingForCopy {
  title: string | null;
  suggestedPrice: number | null;
  description: string | null;
  condition?: string | null;
  brand?: string | null;
  model?: string | null;
}

export function formatListingForClipboard(listing: ListingForCopy): string {
  const parts: string[] = [];

  // Title line — include price inline for marketplace paste
  if (listing.title && listing.suggestedPrice != null) {
    parts.push(`${listing.title} - $${listing.suggestedPrice}`);
  } else if (listing.title) {
    parts.push(listing.title);
  } else if (listing.suggestedPrice != null) {
    parts.push(`$${listing.suggestedPrice}`);
  }

  // Description block
  if (listing.description) {
    if (parts.length > 0) parts.push("");
    parts.push(listing.description);
  }

  // Product details line (compact format for marketplace copy)
  const details: string[] = [];
  if (listing.condition) details.push(`Condition: ${listing.condition}`);
  if (listing.brand) details.push(`Brand: ${listing.brand}`);
  if (listing.model) details.push(`Model: ${listing.model}`);

  if (details.length > 0) {
    if (parts.length > 0) parts.push("");
    parts.push(details.join(" | "));
  }

  return parts.join("\n");
}
