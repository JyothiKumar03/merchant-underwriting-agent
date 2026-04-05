import twilio from "twilio";
import type {
  TUnderwritingResultRow,
  TUnderWritingMode,
  TWhatsAppStatus,
  TTwilioConfig,
  TWhatsAppDeliveryResult,
} from "../types/index.js";
import { ENV } from "../constants/env.js";

const get_twilio_config = (): TTwilioConfig => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = ENV;
  if (
    TWILIO_ACCOUNT_SID === "not-set" ||
    TWILIO_AUTH_TOKEN === "not-set" ||
    TWILIO_WHATSAPP_FROM === "not-set"
  ) {
    throw new Error(
      "Missing Twilio env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM"
    );
  }
  return {
    accountSid: TWILIO_ACCOUNT_SID,
    authToken: TWILIO_AUTH_TOKEN,
    fromNumber: TWILIO_WHATSAPP_FROM,
  };
};

// Builds the WhatsApp message body from the LLM-generated user_message + static offer details

const compose_message = (result: TUnderwritingResultRow, mode: TUnderWritingMode): string => {
  const is_credit = mode === "credit";
  const product = is_credit ? "GrabCredit 💳" : "GrabInsurance 🛡️";
  const user_msg = is_credit ? result.credit_user_message : result.insurance_user_message;

  if (result.risk_tier === "rejected") {
    return [
      `*${product} — Application Update*`,
      "",
      user_msg,
      "",
      "━━━━━━━━━━━━━━━",
      "🔄 We automatically re-evaluate all merchants every quarter.",
      "📞 Questions? Reply to this message.",
      "━━━━━━━━━━━━━━━",
      "_Powered by GrabOn x Poonawalla Fincorp_",
    ].join("\n");
  }

  const offer_lines: string[] = [];

  if (is_credit && result.credit_offer) {
    const c = result.credit_offer;
    offer_lines.push(
      `💰 *Credit Limit:* Rs.${(c.credit_limit_inr / 100_000).toFixed(0)}L`,
      `📈 *Interest Rate:* ${c.interest_rate_percent}% p.a.`,
      `📅 *Tenure Options:* ${c.tenure_options_months.join(" / ")} months`,
      `🏷️ *Tier:* ${result.risk_tier.replace("_", " ").toUpperCase()}`
    );
  } else if (!is_credit && result.insurance_offer) {
    const ins = result.insurance_offer;
    offer_lines.push(
      `🛡️ *Policy:* ${ins.policy_type}`,
      `💰 *Coverage:* Rs.${(ins.coverage_amount_inr / 100_000).toFixed(1)}L`,
      `📋 *Quarterly Premium:* Rs.${ins.quarterly_premium_inr.toLocaleString("en-IN")}`,
      `🏷️ *Tier:* ${result.risk_tier.replace("_", " ").toUpperCase()}`
    );
  }

  return [
    `*${product} — Pre-Approved Offer* 🎉`,
    "",
    user_msg,
    "",
    "━━━━━━━━━━━━━━━",
    "*Your Offer Details:*",
    ...offer_lines,
    "━━━━━━━━━━━━━━━",
    "✅ Reply *ACCEPT* to proceed",
    "❌ Reply *REJECT* to decline",
    "━━━━━━━━━━━━━━━",
    "_Powered by GrabOn x Poonawalla Fincorp_",
  ].join("\n");
};

export const send_whatsapp_offer = async (
  to_number: string,
  result: TUnderwritingResultRow,
  mode: TUnderWritingMode
): Promise<TWhatsAppDeliveryResult> => {
  const message_body = compose_message(result, mode);

  let config: TTwilioConfig;
  try {
    config = get_twilio_config();
  } catch (err) {
    const error_message = err instanceof Error ? err.message : String(err);
    return { status: "failed" as TWhatsAppStatus, errorMessage: error_message, messageBody: message_body };
  }

  const client = twilio(config.accountSid, config.authToken);
  const from = `whatsapp:${config.fromNumber}`;
  const to = `whatsapp:${to_number}`;

  try {
    const message = await client.messages.create({ body: message_body, from, to });
    return { status: "sent" as TWhatsAppStatus, messageSid: message.sid, messageBody: message_body };
  } catch (err) {
    const error_message = err instanceof Error ? err.message : String(err);
    console.error(`[twilio-service] Failed to send WhatsApp to ${to}:`, error_message);
    return { status: "failed" as TWhatsAppStatus, errorMessage: error_message, messageBody: message_body };
  }
};

export const preview_whatsapp_message = (result: TUnderwritingResultRow, mode: TUnderWritingMode): string =>
  compose_message(result, mode);

export const sendWhatsAppOffer = send_whatsapp_offer;
export const previewWhatsAppMessage = preview_whatsapp_message;
