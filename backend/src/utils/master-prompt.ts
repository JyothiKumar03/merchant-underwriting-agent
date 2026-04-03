import type { TEnrichedDealParams } from "../types/deal-types.js";

// ── helpers ──────────────────────────────────────────────────────────────────

const format_discount = (params: TEnrichedDealParams): string =>
  params.discount_type === "percentage"
    ? `${params.discount_value}% OFF`
    : `₹${params.discount_value} OFF`;

const format_expiry = (ts: string): string => {
  try {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return ts;
  }
};

// Character limits per channel — single source of truth used in both prompt
// text and the post-generation validator.
export const CHANNEL_LIMITS: Record<string, number> = {
  email: 60,
  whatsapp: 120,
  push: 50,
  glance: 40,
  payu: 55,
  instagram: 150,
};

// Style keys must exactly match what the distributor tool and dashboard expect.
export const STYLE_KEYS = ["formal", "casual", "urgent"] as const;
export const CHANNEL_KEYS = Object.keys(CHANNEL_LIMITS) as Array<keyof typeof CHANNEL_LIMITS>;
export const LANG_KEYS = ["english", "hindi", "telugu"] as const;

// ── prompt builder ────────────────────────────────────────────────────────────

export const build_master_prompt = (params: TEnrichedDealParams): string => {
  const discount_label = format_discount(params);
  const expiry_label = format_expiry(params.expiry_timestamp);

  // Use whichever field name the enrichment layer provides
  const category = params.merchant_category ?? params.category ?? "General";

  const optional_lines = [
    params.min_order_value ? `- Min order: ₹${params.min_order_value}` : "",
    params.max_redemptions
      ? `- Redemption cap: ${params.max_redemptions} uses`
      : "",
    params.exclusive_flag
      ? `- EXCLUSIVE to GrabOn — not available elsewhere`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Inline limits into the channel descriptions so the LLM sees them next to
  // the instruction — not separated from it in a rules block.
  return `You are GrabOn's lead performance copywriter for the Indian market. Write promotional copy that converts — not copy that merely sounds good.

DEAL:
- Merchant: ${params.merchant_name}
- Category: ${category}
- Discount: ${discount_label}
- Valid until: ${expiry_label}
${optional_lines}

---

TASK: Write 54 unique strings — 3 languages × 3 styles × 6 channels.

---

## OUTPUT STYLE KEYS

Use exactly these three key names. Each must use a fundamentally different psychological mechanism — not just a different tone.

### formal
Professional, benefit-led copy. Lead with what the user gains. No urgency pressure. No crowd references. Speak to a rational buyer who wants to make a good decision. Framing: "here is a genuinely good deal, and here is why."

### casual
Friendly, personal, like a tip from a friend who found a great deal. Warm, direct, no corporate language. Contractions welcome. Framing: "hey, you should check this out."

### urgent
Trigger loss aversion. Use scarcity signals — expiry date, "going fast", "last chance", "ends tonight". The urgency must feel real and anchored to the deal details, not generic. Never sound fake. Framing: "if you don't act now, you'll miss this."

---

## CHANNELS AND CHARACTER LIMITS

Character limits are HARD — count every character including spaces. Exceeding the limit means the string is rejected.

### email — max 60 characters
Inbox subject line competing with dozens. Must earn the open. Lead with the strongest hook. No all-caps. No clickbait. Think: what makes YOU open an email?

### whatsapp — max 120 characters
Arrives as a personal message. Write like a person texting a deal tip to a friend. One strong sentence or two short ones. Do not start with "Hello" or "Dear". Emoji optional.

### push — max 50 characters
An interruption. The user is mid-task. One punchy line, the biggest value signal first. Action words. Zero filler. Billboard at 60 km/h.

### glance — max 40 characters
Lock-screen widget, zero context, user has not opted in. Instantly readable. Merchant name + discount is your entire budget — use it sharply. Do NOT try to fit a CTA.

### payu — max 55 characters
User is on the ${params.merchant_name} payment page, about to pay. Highest-intent moment. Do NOT re-introduce the merchant — they already chose it. Focus entirely on: "you are saving X right now." Reinforce the decision, don't re-sell it. Merchant name is NOT required here — the saving amount is enough.

### instagram — max 150 characters
Caption paired with a visual — the image carries the story, the caption adds energy and a soft CTA. 2–4 natural hashtags. Write for an urban Indian in their 20s scrolling a feed. Trendy but not cringe.

---

## LANGUAGES

### english
Indian English. Use ₹ for amounts. Natural contractions fine. Not British, not American.

### hindi
Devanagari script ONLY — no Roman transliteration anywhere. Write as educated urban Indians actually speak Hindi. Use ₹ for amounts.

### telugu
Telugu script ONLY (తెలుగు) — no Roman transliteration anywhere. Conversational, as spoken in Hyderabad and Andhra Pradesh urban areas. Use ₹ for amounts.

---

## RULES
1. All 54 strings must be unique. No copy-paste with minor word swaps.
2. Every string must include the discount value (${discount_label}).
3. Merchant name is required in all channels EXCEPT payu — see payu instructions above.
4. Character limits are hard limits — count before you write.
5. No URLs, coupon codes, or placeholder text.
6. Hindi and Telugu must be 100% in their respective scripts — zero Roman characters.
7. The three styles must use genuinely different persuasion mechanisms — if formal, casual, and urgent sound the same on any channel, rewrite.

---

Return ONLY a valid JSON object. No explanation, no markdown fences, no trailing commas:

{
  "english": {
    "formal":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" },
    "casual":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" },
    "urgent":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" }
  },
  "hindi": {
    "formal":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" },
    "casual":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" },
    "urgent":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" }
  },
  "telugu": {
    "formal":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" },
    "casual":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" },
    "urgent":       { "email": "", "whatsapp": "", "push": "", "glance": "", "payu": "", "instagram": "" }
  }
}`;
};
