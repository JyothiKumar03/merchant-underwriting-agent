import { z } from "zod";

export const DEAL_CHANNELS = [
  "email",
  "whatsapp",
  "push",
  "glance",
  "payu",
  "instagram",
] as const;

export const DEAL_STYLES = ["formal", "casual", "urgent"] as const;

export const DEAL_LANGUAGES = ["english", "hindi", "telugu"] as const;

export type TDealChannel = (typeof DEAL_CHANNELS)[number];
export type TDealStyle = (typeof DEAL_STYLES)[number];
export type TDealLanguage = (typeof DEAL_LANGUAGES)[number];

export const ZDealParams = z.object({
  merchant_id: z.string().min(1),
  category: z.string().min(1),
  discount_value: z.number().positive(),
  discount_type: z.enum(["percentage", "fixed"]),
  expiry_timestamp: z.string().min(1),
  min_order_value: z.number().optional(),
  max_redemptions: z.number().optional(),
  exclusive_flag: z.boolean().optional(),
});

export type TDealParams = z.infer<typeof ZDealParams>;

export type TEnrichedDealParams = TDealParams & {
  merchant_name: string;
  merchant_category: string;
  merchant_logo?: string;
};

const z_channel_copy = z.object({
  email: z.string(),
  whatsapp: z.string(),
  push: z.string(),
  glance: z.string(),
  payu: z.string(),
  instagram: z.string(),
});

const z_style_variants = z.object({
  formal: z_channel_copy,
  casual: z_channel_copy,
  urgent: z_channel_copy,
});

export const ZDealCopyOutput = z.object({
  english: z_style_variants,
  hindi: z_style_variants,
  telugu: z_style_variants,
});

export type TDealCopyOutput = z.infer<typeof ZDealCopyOutput>;

export type TWebhookLog = {
  channel: TDealChannel;
  status: "delivered" | "failed";
  retries: number;
  latency_ms: number;
};

export type TDistributeResult = {
  merchant_name: string;
  deal_summary: string;
  variants: TDealCopyOutput;
  delivery_logs: TWebhookLog[];
  success_rate: string;
  channels_delivered: number;
  total_strings: number;
  generated_at: string;
};
