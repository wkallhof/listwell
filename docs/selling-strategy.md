# Listwell — Selling Strategy Guide

**Purpose:** This document is the reference material for Listwell's AI agent when generating listing titles, descriptions, pricing recommendations, and market notes. It codifies what makes listings sell fast on peer-to-peer marketplaces — particularly Facebook Marketplace — so the agent produces output that is strategically optimized, not just grammatically correct.

This is a living document. As we test listings and gather conversion data, the rules here get refined.

---

## 1. Title Construction

The title is search engine optimization. Facebook Marketplace is powered by AI ranking that matches listings to buyer searches using keywords in the title. Getting found is the first battle.

### Formula

**Brand + Item Type + Key Spec + Condition**

Examples:
- `DeWalt 20V MAX Cordless Drill – Like New`
- `IKEA Hemnes 8-Drawer Dresser – White, Great Condition`
- `Sony WH-1000XM5 Headphones – Barely Used`
- `KitchenAid Artisan Stand Mixer – 5 Qt, Red`

### Rules

- **65 characters max.** Facebook truncates beyond this in search results and the browse feed. Every word must earn its spot.
- **Title Case.** Capitalize each word. It reads better in thumbnails and search results.
- **Front-load the most searchable terms.** Brand first, then product type. Buyers search "DeWalt drill" not "cordless power tool by DeWalt."
- **Include the key differentiating spec.** Size, capacity, color, model number — whatever a buyer would use to narrow their search.
- **Condition goes last.** It's important but not what people search for.
- **Separate details with dashes or commas.** Not pipes, not slashes.

### Never Do

- ALL CAPS or excessive capitalization ("AMAZING DEAL!!!")
- Emojis in titles
- Marketing language ("Must Have," "Hot Item," "Won't Last")
- Generic titles ("Dresser" or "Dresser for Sale")
- The word "selling" (it's implied — you're on a marketplace)

### Synonym Awareness

The agent should consider what alternate terms buyers might search and, when space allows, work them into the title or ensure they appear in the description. A "dresser" is also a "chest of drawers." A "couch" is also a "sofa." A "TV stand" is also a "media console" or "entertainment center."

---

## 2. Description Writing

The description answers every question a buyer would ask so they message to buy, not to ask for basic info. It also provides keyword surface area for the search algorithm.

### Structure

Write in this order:

1. **What it is and why you're selling it.** One or two sentences, first-person, casual. Establish the item and give a believable reason for selling.
2. **Specifics.** Dimensions, brand, model, material, color, weight if relevant. Include the original retail price if known — this anchors perceived value ("Retails for $250, asking $95" frames the price as a bargain).
3. **Condition — honest.** Describe wear, scratches, missing parts. Don't hide flaws. Transparency builds trust and prevents disputes. If something doesn't work, say so. If it's perfect, say that too but don't oversell.
4. **Logistics.** Pickup location (neighborhood, not exact address). Whether you can meet somewhere. If heavy, note that they may need a truck or a friend.
5. **Closing invitation.** "Message me with any questions" or "Happy to send more pics."

### Voice and Tone

The listing must read like a real person wrote it. This is the core product promise — replacing the work a real person would do, not producing corporate copy or AI slop.

- **First-person perspective.** "I bought this a couple years ago" not "This item was purchased." "Works great, I just don't use it anymore" not "Item is in functional condition."
- **Conversational but not sloppy.** Short paragraphs. Complete sentences. No text-speak.
- **No bullet points in the description body.** Bullet points signal a business listing, not a person cleaning out their garage. Use flowing sentences and short paragraphs instead. (Specs like dimensions can be listed on separate lines if needed, but not with bullet markers.)
- **No ALL CAPS.** Not even for emphasis.
- **No exclamation marks** unless one naturally fits the tone. Never more than one in the entire listing.
- **Believable reason for selling.** Don't force it or make it elaborate. Simple and honest: "Upgrading and don't need two," "Doesn't fit my routine anymore," "Moving and can't take it with me," "Clearing out the garage." If the user provided a reason, use their words.
- **Never write "SERIOUS INQUIRIES ONLY"** or "Don't waste my time" or "Will not respond to 'is this still available.'" These alienate legitimate buyers.
- **Never say "see photo for dimensions."** Type the actual dimensions.

### Keyword Strategy

- Include 3–5 relevant keywords naturally in the description. Don't keyword-stuff.
- Add synonym terms for the item type (dresser/chest of drawers/bureau, couch/sofa/sectional).
- Think about what a buyer would type into search and make sure those words appear somewhere in the title or description.
- If the item is compatible with something popular, mention it ("fits Keurig K-Cup pods," "works with DeWalt 20V battery system").

### Description Length

Aim for 80–150 words for most items. Enough to be thorough, short enough that nobody's scrolling past a wall of text. Simple items (a lamp, a set of plates) can be shorter. Complex items (electronics, furniture with specific dimensions, tools with specs) should be on the longer end.

---

## 3. Pricing Strategy

### The Negotiation Buffer

Facebook Marketplace has a deeply ingrained negotiation culture. Almost every buyer will try to negotiate. The suggested price should be **10–15% above the seller's realistic target price** so the buyer can "win" the negotiation and the seller still hits their number.

When presenting the price to the user, explain this clearly:
- **Suggested list price:** The number to post (includes negotiation buffer)
- **Expected sale price:** What you'll likely actually get after negotiation
- **Price range:** The market range based on comparable sales

### Market Research Pricing Framework

When the agent researches pricing, apply these general benchmarks as a sanity check:

| Condition | Typical % of Retail |
|-----------|-------------------|
| New / Sealed | 60–80% |
| Like New / Open Box | 50–70% |
| Good / Lightly Used | 40–60% |
| Fair / Visibly Worn | 20–40% |
| Poor / For Parts | 10–20% |

These are starting points. Actual market price depends on demand, seasonality, and local supply. The agent's web research should override these defaults when real comparable data is available.

### Pricing Psychology

- **Under $50:** Charm pricing can help. $47 performs slightly better than $50. $23 beats $25.
- **Over $50:** Round numbers are preferred, especially for local cash transactions. $80, $100, $150 — not $83 or $147.
- **OBO (Or Best Offer):** Only recommend for items priced above $20. Below that, OBO invites penny-haggling that wastes the seller's time. When suggesting OBO, the agent should factor this into the list price — buyers interpret OBO as "I can probably get 15–20% off," so price accordingly.
- **Include retail price in the description** when it strengthens the value proposition. "Retails for $250, asking $95" is powerful. Don't include retail price if the item is so old or depreciated that the comparison hurts rather than helps.

### What to Tell the Seller in Market Notes

The research notes should include:
- Number of comparable listings found and price range observed
- Whether the market seems saturated (many similar listings) or undersupplied
- Any pricing patterns noticed (e.g., "listings with original box sell for 20% more")
- Whether the item tends to sell faster at a certain price point
- Seasonal considerations if relevant (e.g., "outdoor furniture demand peaks in spring")
- The "was/now" markdown tip: if the item doesn't sell in a week, dropping the price on the existing listing triggers a struck-through original price that creates urgency

---

## 4. Platform-Specific Optimization

While Listwell outputs a universal listing, the agent should be aware of platform differences and note them for the seller when relevant.

### Facebook Marketplace

- **Local pickup emphasis.** Lead with pickup convenience. Mention the neighborhood or cross-streets (not exact address).
- **Zero fees on local sales.** This is a major advantage. Shipped items incur a 10% selling fee.
- **Fill out every field** when the seller posts: category, subcategory, brand, condition, color, material. The algorithm rewards completeness.
- **The algorithm prioritizes recency.** If it doesn't sell in 7–10 days, tell the seller to delete and relist with a tweaked title and new primary photo. This resets the algorithm's "honeymoon period."
- **Peak posting times:** Weekday mornings 8 AM–12 PM, evenings 6–9 PM, Saturday mornings. Wednesday has highest overall engagement.
- **Response speed matters enormously.** The first seller to respond typically wins the sale. The market note should remind sellers to turn on notifications and reply fast.
- **Cross-post to local buy/sell groups** for additional reach.

### eBay

- **Shipping is expected.** Include weight/size estimates if available so the seller can set shipping costs.
- **"Sold" listings are the best pricing data source.** The agent should prioritize eBay sold comps during research.
- **More detailed specs matter.** eBay buyers are often searching for specific models, part numbers, and compatibility info.
- **Condition descriptions follow eBay's structured format** (New, Open Box, Like New, Very Good, Good, Acceptable).

### Craigslist

- **Bare-bones platform.** No algorithm, no fees, no shipping. Listings are chronological.
- **Price firmly.** Less negotiation culture than Facebook Marketplace — buyers expect closer-to-listed-price transactions.
- **Safety emphasis.** Meet in public locations. Cash only.

---

## 5. Image Enhancement Guidance

This section informs the Gemini image editing prompts. The goal is **authentic but improved** — not studio product photography.

### The Principle

Buyers on Facebook Marketplace want to see the actual item in a real setting. They're suspicious of overly polished product photos (it signals a scam or a business, not a person selling their stuff). Stock photos or white-background cutouts perform poorly. But messy, dark, blurry photos tank listings.

The sweet spot: **the item looks like it was photographed by someone who took 30 seconds to find a clean spot in their house with decent light.**

### Enhancement Goals

- **Improve lighting.** Brighten underexposed images. Simulate the warmth of natural window light. Remove harsh shadows and color casts from artificial lighting.
- **Reduce background clutter.** De-emphasize (don't remove) distracting background elements. The background should recede, not compete with the item.
- **Maintain authenticity.** Don't remove scratches, dents, stains, or wear from the item itself. The item must look exactly like what the buyer will receive.
- **Keep it real.** The result should look like a good phone photo, not a magazine ad. No dramatic filters, no HDR halos, no artificial bokeh.
- **Preserve the item's true color.** Color accuracy matters — a buyer who shows up expecting navy blue and sees black will be annoyed and may walk away.

### Enhancement Should NOT

- Remove or hide defects on the item
- Change the item's color
- Add props or staging that wasn't in the original
- Make the image look like a stock photo
- Add watermarks, borders, text overlays, or logos
- Apply heavy filters or artistic effects

### Category-Specific Notes

- **Furniture:** Show scale. A dresser photographed with nothing around it for reference could be any size. Enhancement should preserve context objects that show scale.
- **Electronics:** Screens should be visible and readable if they were on in the original photo. Don't wash out screen content.
- **Clothing:** Wrinkles are fine and expected. Don't smooth fabric to the point it looks digitally altered.
- **Tools:** Show the business end clearly. Blades, bits, drill chucks — buyers want to assess wear on functional surfaces.

---

## 6. Condition Assessment

When the agent analyzes images and user description to determine condition, use this framework:

| Condition | Criteria |
|-----------|----------|
| **New** | Sealed in original packaging. Never used. Tags still attached (for clothing). |
| **Like New** | Used once or twice. No visible wear. All original accessories and packaging present. Indistinguishable from new to a buyer. |
| **Good** | Regular use but well cared for. Minor cosmetic wear (light scratches, small scuffs). Fully functional. |
| **Fair** | Noticeable wear. Visible scratches, fading, minor dents. Still functional but clearly used. May be missing non-essential accessories. |
| **Poor** | Heavy wear, damage, or missing parts. May have functional issues. Sold "as-is" or "for parts." |

### Condition Honesty Rules

- **When in doubt, round down.** Calling something "Like New" when it's "Good" creates disputes. Calling "Good" when it's "Like New" creates pleasant surprises.
- **Always mention specific flaws** the agent detects in images, even if the overall condition is good. "Good condition — small scratch on the top left corner" is better than just "Good condition."
- **If the user says it works, trust them** but note that the agent can't verify functionality from photos. If something looks like it might not work (corroded battery terminals, cracked screen), flag it.

---

## 7. Category-Specific Listing Tactics

### Furniture

- Always include: dimensions (H × W × D), material, color, weight if heavy
- Mention if it disassembles for transport
- Note if it requires assembly and whether hardware/instructions are included
- "Pet-free and smoke-free home" if the user mentions it — buyers care about this for upholstered items
- Seasonal timing: peaks before college move-in (August) and during spring cleaning season

### Electronics

- Include: brand, model number, storage/memory specs, connectivity, what's included (charger, cables, remote)
- Battery health or age if known
- Note whether it's been factory reset
- Mention compatibility (e.g., "works with iPhone and Android")

### Tools

- Include: brand, voltage/power, battery type and whether batteries are included
- Note what accessories/bits come with it
- "Works perfectly" vs. "haven't tested recently" — be specific about functionality

### Clothing & Accessories

- Include: brand, size, material, measurements if possible
- Note any alterations
- Condition of soles for shoes, hardware for bags
- Mention if from a smoke-free/pet-free home

### Kids & Baby Items

- Safety is paramount. Note any recalls if known.
- Include age range, weight limits
- "From a smoke-free home" matters more here
- Mention cleaning/sanitization

### Vehicles (if applicable)

- Mileage, year, make, model, trim are non-negotiable
- Maintenance history if available
- Known issues must be disclosed
- Clean title vs. salvage title

---

## 8. What the Agent Should Never Generate

- **Pressure tactics.** No "act fast," "won't last," "today only," fake urgency.
- **Claims the agent can't verify.** Don't say "works perfectly" unless the user confirmed functionality. Say "works well per the seller" or "I haven't had any issues with it" if the user indicated it works.
- **Competitive disparagement.** Don't trash other listings or sellers.
- **Promises about the platform.** Don't say "Facebook Marketplace guarantees..." or make claims about buyer protection.
- **Personal information.** Don't include the seller's full name, phone number, or home address. Neighborhood-level location only.
- **Prohibited item language.** Be aware that certain words trigger Facebook's automated moderation — "gun" (even in toy listings), color names like "mocha" or "nude," medical terms. The agent should avoid unnecessarily using flagged terms and prefer alternatives when possible.

---

## 9. Market Notes Template

When presenting research findings to the seller, the agent should structure market notes as a brief, scannable summary:

**What the market looks like:** 1–2 sentences on how many comparable listings exist and the price range.

**Pricing rationale:** Why the suggested price is what it is. Reference specific comparable sales when available. ("Similar drills with batteries sell for $80–120 on eBay; yours includes two batteries and the original case, putting it on the higher end.")

**Sell-faster tips:** 1–2 actionable suggestions specific to this item. ("Post on a weekday evening for best visibility." "Cross-post to local tool swap groups." "Include 'compatible with all DeWalt 20V tools' in the description — that's a high-volume search term.")

**Shipping note (if relevant):** Whether this item is worth offering shipping or should stay local-only. Items in the $35–120 range with low shipping weight are good candidates. Heavy, bulky, fragile, or sub-$30 items should stay local.

---

## 10. The Relisting Reminder

When the agent generates a listing, the market notes should always include a brief reminder about the relisting strategy:

> If this doesn't sell within 7–10 days, delete the listing and repost it. A fresh listing resets the algorithm and gets a visibility boost that price drops on stale listings can't match. When you relist, swap the lead photo and tweak the title slightly to target different search terms.

This is one of the highest-leverage tactics available to sellers and costs nothing. It should be included in every set of market notes.