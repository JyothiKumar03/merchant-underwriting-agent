import twilio from "twilio";
import type {
  UnderwritingResult,
  Mode,
  WhatsAppStatus,
} from "../types/index.js";

// ── Client factory ─────────────────────────────────────────────────────────────

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  /** The Twilio WhatsApp sandbox number, e.g. +14155238886 */
  fromNumber: string;
}

function getTwilioConfig(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      "Missing Twilio env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM"
    );
  }

  return { accountSid, authToken, fromNumber };
}

// ── Message composers ──────────────────────────────────────────────────────────

function composeCreditMessage(result: UnderwritingResult): string {
  if (result.risk_tier === "rejected") {
    return `🏦 GrabCredit — Application Update

Hi ${result.merchant_name},

After reviewing your GrabOn merchant profile, we're unable to extend a credit offer at this time.

${result.credit_rationale}

We automatically re-evaluate all merchants quarterly.
Powered by GrabCredit × Poonawalla Fincorp`;
  }

  const c = result.credit_offer!;
  return `🏦 GrabCredit Pre-Approved Offer

Hi ${result.merchant_name},

You've been pre-approved for a working capital loan:
💰 Credit Limit: ₹${(c.credit_limit_inr / 100_000).toFixed(0)}L
📊 Rate: ${c.interest_rate_percent}% p.a. (${result.risk_tier})
📅 Tenure: ${c.tenure_options_months.join(" / ")} months

Why you qualified:
${result.credit_rationale}

Reply ACCEPT to proceed or DETAILS for full terms.
Powered by GrabCredit × Poonawalla Fincorp`;
}

function composeInsuranceMessage(result: UnderwritingResult): string {
  if (result.risk_tier === "rejected") {
    return `🛡️ GrabInsurance — Application Update

Hi ${result.merchant_name},

After reviewing your GrabOn merchant profile, we're unable to extend an insurance offer at this time.

${result.insurance_rationale}

We automatically re-evaluate all merchants quarterly.
Powered by GrabInsurance × Poonawalla Fincorp`;
  }

  const ins = result.insurance_offer!;
  return `🛡️ GrabInsurance Pre-Approved Offer

Hi ${result.merchant_name},

You're eligible for:
🛡️ ${ins.policy_type}
💰 Coverage: ₹${(ins.coverage_amount_inr / 100_000).toFixed(1)}L
📊 Premium: ₹${ins.quarterly_premium_inr.toLocaleString("en-IN")}/quarter (${result.risk_tier} rate)

Why you qualified:
${result.insurance_rationale}

Reply ACCEPT to proceed or DETAILS for full terms.
Powered by GrabInsurance × Poonawalla Fincorp`;
}

// ── Delivery result ────────────────────────────────────────────────────────────

export interface WhatsAppDeliveryResult {
  status: WhatsAppStatus;
  messageSid?: string;
  errorMessage?: string;
  messageBody: string;
}

// ── Main send function ─────────────────────────────────────────────────────────

/**
 * Sends a formatted WhatsApp offer notification via the Twilio sandbox.
 *
 * Returns a structured result — never throws — so delivery failure cannot
 * crash an underwriting response.
 */
export async function sendWhatsAppOffer(
  toNumber: string,
  result: UnderwritingResult,
  mode: Mode
): Promise<WhatsAppDeliveryResult> {
  const messageBody =
    mode === "credit"
      ? composeCreditMessage(result)
      : composeInsuranceMessage(result);

  let config: TwilioConfig;
  try {
    config = getTwilioConfig();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { status: "failed", errorMessage, messageBody };
  }

  const client = twilio(config.accountSid, config.authToken);
  const from = `whatsapp:${config.fromNumber}`;
  const to = `whatsapp:${toNumber}`;

  try {
    const message = await client.messages.create({ body: messageBody, from, to });
    return { status: "sent", messageSid: message.sid, messageBody };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[twilio-service] Failed to send WhatsApp to ${to}:`, errorMessage);
    return { status: "failed", errorMessage, messageBody };
  }
}

/**
 * Returns the composed message body without sending it.
 * Used by the dashboard's WhatsApp preview panel.
 */
export function previewWhatsAppMessage(
  result: UnderwritingResult,
  mode: Mode
): string {
  return mode === "credit"
    ? composeCreditMessage(result)
    : composeInsuranceMessage(result);
}
