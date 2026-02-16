interface EnhancementPromptInput {
  category?: string | null;
  condition?: string | null;
  title?: string | null;
}

export function buildEnhancementPrompt(input?: EnhancementPromptInput): string {
  const parts: string[] = [
    `Edit this product photo for a peer-to-peer marketplace listing. The goal is "authentic but improved" — it should look like a good phone photo taken in decent light, not a studio product shot.`,
    "",
    "Enhancement rules:",
    "- Improve lighting: brighten underexposed areas, simulate warm natural window light, remove harsh shadows and color casts from artificial lighting",
    "- Reduce background clutter: de-emphasize (don't remove) distracting background elements so the item stands out",
    "- Preserve the item's true color — color accuracy matters",
    "- Do NOT remove or hide any defects, scratches, dents, or wear on the item itself",
    "- Do NOT add props, staging, watermarks, borders, text, or logos",
    "- Do NOT apply heavy filters, HDR halos, or artificial bokeh",
    "- The result must look like a real phone photo, not a magazine ad or stock photo",
  ];

  const categoryNotes = getCategoryNotes(input?.category);
  if (categoryNotes) {
    parts.push("", `Category-specific guidance (${input!.category}):`, categoryNotes);
  }

  parts.push("", "Return only the enhanced image. Do not include any text in your response.");

  return parts.join("\n");
}

function getCategoryNotes(category?: string | null): string | null {
  if (!category) return null;

  const lower = category.toLowerCase();

  if (lower.includes("furniture")) {
    return "- Preserve context objects that show scale (a dresser next to nothing looks ambiguous in size)\n- Keep the room context visible but de-emphasized";
  }

  if (lower.includes("electronic") || lower.includes("computer") || lower.includes("phone") || lower.includes("tv") || lower.includes("audio")) {
    return "- If screens were on in the original, keep them visible and readable\n- Don't wash out screen content or LED indicators";
  }

  if (lower.includes("clothing") || lower.includes("apparel") || lower.includes("shoe") || lower.includes("fashion")) {
    return "- Wrinkles are expected — don't over-smooth fabric\n- Preserve texture and material appearance";
  }

  if (lower.includes("tool") || lower.includes("hardware")) {
    return "- Keep functional surfaces (blades, bits, drill chucks) clearly visible\n- Buyers assess wear on functional parts, so preserve detail there";
  }

  return null;
}
