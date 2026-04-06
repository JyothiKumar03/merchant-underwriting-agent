import type { TEnrichedDealParams } from "../types/deal-types.js";

const format_discount = (params: TEnrichedDealParams): string => {
  if (params.discount_type === "percentage") {
    return `${params.discount_value}% OFF`;
  }
  return `₹${params.discount_value} OFF`;
};

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

export const build_master_prompt = (params: TEnrichedDealParams): string => {
  const discount_label = format_discount(params);
  const expiry_label = format_expiry(params.expiry_timestamp);
  const min_order_clause = params.min_order_value
    ? `Minimum order value: ₹${params.min_order_value}.`
    : "";
  const redemption_clause = params.max_redemptions
    ? `Limited to ${params.max_redemptions} redemptions.`
    : "";
  const exclusive_clause = params.exclusive_flag
    ? "This is an EXCLUSIVE GrabOn deal — available only on GrabOn."
    : "";

  return `You are GrabOn's lead performance copywriter for the Indian market. Your job is to write promotional copy that actually converts — not just copy that sounds good.

DEAL:
- Merchant: ${params.merchant_name}
- Category: ${params.merchant_category}
- Discount: ${discount_label}
- Valid until: ${expiry_label}
${min_order_clause ? `- Min order: ₹${params.min_order_value}` : ""}
${redemption_clause ? `- Redemption cap: ${params.max_redemptions}` : ""}
${exclusive_clause ? `- EXCLUSIVE to GrabOn — not available elsewhere` : ""}

---

TASK: Write 54 unique strings — 3 languages × 3 styles × 6 channels.

---

## STYLES

Each style must use a fundamentally different psychological mechanism. Do not just change the tone — change the persuasion strategy.

### 1. urgency_driven
Trigger loss aversion and fear of missing out. Use scarcity signals (limited time, limited stock, expiry pressure). Write as if the user will regret not acting now. Words like "ends tonight", "only X left", "last chance", "going fast" work here. Never sound fake — the urgency must feel real and tied to the deal details.

### 2. value_driven
Make the user feel smart for spotting a great deal. Lead with the savings math or the value proposition — what they get, not what they save. Frame it as a win: "you're getting ₹X worth of Y for less". Avoid urgency. This user is rational and compares options. Speak to their desire to get the most out of every rupee.

### 3. social_proof_driven
Use the crowd as the persuader. Imply that many people are already using this deal — it is popular, trusted, loved. Use signals like "thousands grabbed this", "most popular deal today", "everyone's talking about", "top pick". The implicit message: smart people are already on this, don't be left out.

---

## CHANNELS

Each channel has a distinct user context. Write for that context — not just within the character limit.

### email (max 60 chars)
This is an inbox subject line competing with dozens of others. It must earn the open. Use a curiosity gap or lead with the strongest hook — merchant + discount in the first few words. Avoid clickbait. Avoid all-caps. Think: what would make YOU open this?

### whatsapp (max 120 chars)
The user receives this as a personal message, possibly from a friend or a brand they trust. Write like a person texting a tip to a friend — warm, direct, no corporate fluff. One strong sentence or two short ones. Emoji is optional but can add warmth. Do not start with "Hello" or "Dear".

### push (max 50 chars)
This is an interruption. The user is doing something else when this arrives. You have one punchy line to earn a tap. Lead with the biggest value signal. Use action words. Avoid filler. Think: headline of a billboard seen at 60 km/h.

### glance (max 40 chars)
Shown on the lock screen or Glance widget with zero context. The user has not opted in — this just appears. It must be instantly readable and intriguing enough to unlock. Pure signal, zero noise. Merchant name + discount is usually enough if written sharply.

### payu (max 55 chars)
The user is already on the payment page, card in hand, about to complete a purchase on ${params.merchant_name}. This is the highest-intent moment. Reinforce that they are getting a great deal right now. Avoid re-selling the merchant — they already chose it. Focus on "you're saving X" or "exclusive deal applied".

### instagram (max 150 chars)
This is a caption paired with a visual. The image does the heavy lifting — the caption extends the mood and adds action. Be trendy, use natural-sounding hashtags (2–4 max), and end with a soft CTA or a hook. Write for a 22-year-old Indian user scrolling their feed.

---

## LANGUAGES

### english
Indian English — not British, not American. Use ₹ for amounts. Natural contractions are fine. Avoid overly formal phrasing.

### hindi
Pure Devanagari script only. Write the way educated urban Indians actually speak Hindi — a natural mix is fine but the script must be Devanagari throughout. No Roman transliteration at all. Use ₹ for amounts.

### telugu
Pure Telugu script (తెలుగు) only. Conversational, as spoken in Andhra Pradesh and Telangana urban areas. No Roman transliteration. Use ₹ for amounts.

---

## RULES
- All 54 strings must be unique — no copy-pasting with minor word swaps.
- Every string must mention the merchant name and the discount value.
- Character limits are hard limits — do not exceed them.
- No URLs, coupon codes, or placeholder text.
- Hindi and Telugu must be 100% in their respective scripts.

---

Return ONLY a valid JSON object in this exact structure. No explanation, no markdown, no extra text:
{
  "english": {
    "urgency_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." },
    "value_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." },
    "social_proof_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." }
  },
  "hindi": {
    "urgency_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." },
    "value_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." },
    "social_proof_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." }
  },
  "telugu": {
    "urgency_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." },
    "value_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." },
    "social_proof_driven": { "email": "...", "whatsapp": "...", "push": "...", "glance": "...", "payu": "...", "instagram": "..." }
  }
}`;
};