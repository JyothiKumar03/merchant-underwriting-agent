import { z } from "zod";
import { generate_object } from "../../services/ai-service.js";
import { build_master_prompt } from "../../utils/master-prompt.js";
import { simulate_webhooks } from "../../services/webhook-simulator.js";
import { get_deal_merchant } from "../../data/deal-merchants.js";
import {
  ZDealParams,
  ZDealCopyOutput,
} from "../../types/deal-types.js";
import type { TDistributeResult } from "../../types/deal-types.js";

// Raw Zod shape for MCP tool input schema registration
export const distribute_deal_input_shape = {
  merchant_id: z.string().describe("Merchant identifier, e.g. 'zomato-001'"),
  category: z.string().describe("Deal category, e.g. 'Food & Dining'"),
  discount_value: z.number().describe("Numeric discount amount"),
  discount_type: z
    .enum(["percentage", "fixed"])
    .describe("Whether discount is a percentage or fixed amount in ₹"),
  expiry_timestamp: z
    .string()
    .describe("ISO 8601 expiry timestamp, e.g. '2026-04-15T23:59:59Z'"),
  min_order_value: z
    .number()
    .optional()
    .describe("Minimum cart value in ₹ to apply the deal"),
  max_redemptions: z
    .number()
    .optional()
    .describe("Maximum number of times the deal can be redeemed"),
  exclusive_flag: z
    .boolean()
    .optional()
    .describe("True if this deal is exclusive to GrabOn"),
};

export const distribute_deal_handler = async (
  params: Record<string, unknown>
): Promise<{ content: Array<{ type: "text"; text: string }> }> => {
  // Validate input
  const validated = ZDealParams.parse(params);

  // Enrich with merchant metadata
  const merchant = get_deal_merchant(validated.merchant_id);
  const enriched = {
    ...validated,
    merchant_name: merchant?.name ?? validated.merchant_id,
    merchant_category: merchant?.primary_category ?? validated.category,
    merchant_logo: merchant?.logo_url,
  };

  // Build prompt and generate all 54 strings in one LLM call
  const prompt = build_master_prompt(enriched);

  const copy_output = await generate_object({
    models: [{ provider: "openai", model_id: "gpt-4o" }],
    system:
      "You are GrabOn's senior Indian-market copywriter specializing in localized deal distribution. Always return valid JSON that exactly matches the requested structure.",
    prompt,
    schema: ZDealCopyOutput,
    max_tokens: 8000,


    temperature: 0.75,
  });

  // Simulate webhook delivery to all 6 channels concurrently
  const delivery_logs = await simulate_webhooks();

  const delivered_count = delivery_logs.filter(
    (l) => l.status === "delivered"
  ).length;

  const result: TDistributeResult = {
    merchant_name: enriched.merchant_name,
    deal_summary: `${enriched.merchant_name} — ${
      validated.discount_type === "percentage"
        ? `${validated.discount_value}% OFF`
        : `₹${validated.discount_value} OFF`
    }`,
    variants: copy_output,
    delivery_logs,
    success_rate: `${Math.round((delivered_count / delivery_logs.length) * 100)}%`,
    channels_delivered: delivered_count,
    total_strings: 54,
    generated_at: new Date().toISOString(),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};
