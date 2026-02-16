interface EnhancementPromptInput {
  category?: string | null;
  condition?: string | null;
  title?: string | null;
}

const CATEGORY_INSTRUCTIONS: Record<string, string> = {
  furniture:
    "Preserve objects near the furniture that provide scale reference — a person sitting, a lamp on a table, a book on a shelf. Buyers need to judge size. Do not crop out context that shows how large the piece is.",
  electronics:
    "If a screen is visible and was on in the original photo, keep the screen content readable. Do not wash out or blur screen displays. Ensure ports, buttons, and labels remain sharp and legible.",
  tools:
    "Keep the functional surfaces sharp and clear — blades, drill bits, chuck jaws, cutting edges. Buyers want to assess wear on the parts that do the work. Do not smooth or soften metal textures.",
  "clothing & accessories":
    "Preserve the natural texture of the fabric. Wrinkles are expected and authentic — do not smooth fabric to the point it looks digitally altered. Maintain accurate color representation of the material.",
  clothing:
    "Preserve the natural texture of the fabric. Wrinkles are expected and authentic — do not smooth fabric to the point it looks digitally altered. Maintain accurate color representation of the material.",
  "kids & baby items":
    "Keep the item looking clean and safe. Preserve any safety labels, brand markings, or weight limit indicators that are visible. Buyers of children's items are especially attentive to condition and cleanliness.",
};

function getCategoryInstruction(category: string | null | undefined): string {
  if (!category) return "";

  const key = category.toLowerCase();
  for (const [cat, instruction] of Object.entries(CATEGORY_INSTRUCTIONS)) {
    if (key.includes(cat) || cat.includes(key)) {
      return `\n\nCategory-specific guidance (${category}): ${instruction}`;
    }
  }
  return "";
}

export function buildEnhancementPrompt(input: EnhancementPromptInput): string {
  const categoryNote = getCategoryInstruction(input.category);
  const itemContext =
    input.title ? `The item is: ${input.title}.` : "The item category is unknown.";
  const conditionNote =
    input.condition
      ? ` The seller describes its condition as "${input.condition}".`
      : "";

  return `Enhance this product photo for a peer-to-peer marketplace listing. ${itemContext}${conditionNote}

Goals:
- Improve lighting: brighten underexposed areas, simulate warm natural window light, remove harsh shadows and color casts from artificial lighting
- Reduce background clutter: de-emphasize (do not remove) distracting background elements so the item stands out
- Maintain authenticity: the result should look like a good phone photo taken by someone who found a clean spot with decent light — not a magazine ad or stock photo
- Preserve the item's true color: color accuracy matters, buyers who show up expecting navy blue and see black will walk away

Rules you must follow:
- NEVER remove or hide defects on the item (scratches, dents, stains, wear marks must remain visible)
- NEVER change the item's color
- NEVER add props, staging, text overlays, watermarks, borders, or logos
- NEVER apply heavy filters, HDR halos, or artificial bokeh
- NEVER make the image look like a stock photo or studio product shot${categoryNote}`;
}
