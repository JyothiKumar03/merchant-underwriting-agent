import type { TDealChannel, TWebhookLog } from "../types/deal-types.js";
import { DEAL_CHANNELS } from "../types/deal-types.js";

// Realistic per-channel success probabilities
const CHANNEL_SUCCESS_RATES: Record<TDealChannel, number> = {
  email: 0.95,
  whatsapp: 0.98,
  push: 0.85,
  glance: 0.80,
  payu: 0.92,
  instagram: 0.88,
};

// Realistic per-channel base latencies in ms
const CHANNEL_BASE_LATENCY: Record<TDealChannel, number> = {
  email: 220,
  whatsapp: 110,
  push: 180,
  glance: 150,
  payu: 95,
  instagram: 200,
};

const simulate_channel_attempt = async (
  channel: TDealChannel
): Promise<boolean> => {
  const latency = CHANNEL_BASE_LATENCY[channel] + Math.floor(Math.random() * 80);
  await new Promise((r) => setTimeout(r, latency));
  return Math.random() < CHANNEL_SUCCESS_RATES[channel];
};

const simulate_single_channel = async (
  channel: TDealChannel
): Promise<TWebhookLog> => {
  const start = Date.now();
  let retries = 0;
  let delivered = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    delivered = await simulate_channel_attempt(channel);
    if (delivered) break;

    retries++;
    if (attempt < 2) {
      // Exponential backoff: 300ms, 600ms
      await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
    }
  }

  return {
    channel,
    status: delivered ? "delivered" : "failed",
    retries,
    latency_ms: Date.now() - start,
  };
};

export const simulate_webhooks = async (): Promise<TWebhookLog[]> => {
  // Run all 6 channel simulations concurrently
  const results = await Promise.all(
    DEAL_CHANNELS.map((channel) => simulate_single_channel(channel))
  );
  return results;
};
