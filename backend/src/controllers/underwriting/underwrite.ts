import type { Request, Response } from "express";
import { z } from "zod";
import { get_merchant_by_id } from "../../data/merchants.js";
import { get_category_benchmark } from "../../data/category-benchmarks.js";
import {
  get_result_by_merchant,
  upsert_underwriting_result,
  patch_rationale,
} from "../../models/schema.js";
import { run_scoring } from "../../utils/scoring-engine.js";
import { calc_both_offers } from "../../utils/offer-calculator.js";
import { generate_object } from "../../services/ai-service.js";
import {
  RATIONALE_MODELS,
  RATIONALE_SYSTEM_PROMPT,
  build_rationale_prompt,
} from "../../utils/ai-prompts.js";
import { HTTP, AI_SERVICE } from "../../constants/index.js";
import type {
  TUnderWritingMode,
   TRationaleOutput,
   TMerchantProfile,
   TRiskTier,
   TScoringBreakdown,
   TCreditOffer,
  TInsuranceOffer,
 TCategoryBenchmark,
} from "../../types/index.js";
import {
  ZUnderwriteBody,
  ZMerchantIdParam,
  ZRationaleOutput,
} from "../../types/index.js";

export const underwrite = async (req: Request, res: Response): Promise<void> => {
  // 1. Zod validation
  let id: string;
  let mode: TUnderWritingMode;

  try {
    ({ id } = ZMerchantIdParam.parse(req.params));
    ({ mode } = ZUnderwriteBody.parse(req.body));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(HTTP.BAD_REQUEST).json({ error: "Validation failed", details: z.treeifyError(err) });
      return;
    }
    throw err;
  }

  // 2. Find merchant
  const merchant = get_merchant_by_id(id);
  if (!merchant) {
    res.status(HTTP.NOT_FOUND).json({ error: `Merchant ${id} not found` });
    return;
  }

  const benchmark = get_category_benchmark(merchant.category);

  // 3. Check DB for existing result — apply caching logic
  const existing = await get_result_by_merchant(id);

  if (existing) {
    const has_rationale = mode === "credit"
      ? existing.credit_rationale.length > 0
      : existing.insurance_rationale.length > 0;

    if (has_rationale) {
      res.status(HTTP.OK).json({ result: existing });
      return;
    }

    // Scoring is cached — only the rationale for this mode is missing
    const output = await generate_rationale(
      mode, merchant,
      existing.risk_tier, existing.scoring,
      existing.credit_offer, existing.insurance_offer,
      benchmark
    );
    await patch_rationale(id, mode, output.analyst_explanation, output.user_message);

    const updated = await get_result_by_merchant(id);
    res.status(HTTP.OK).json({ result: updated });
    return;
  }

  // 4. Full pipeline: pre-filter → scoring → both offers → AI (selected mode only)
  const { scoring, tier } = run_scoring(merchant, benchmark);
  const { credit_offer, insurance_offer } = calc_both_offers(merchant, tier);

  const output = await generate_rationale(
    mode, merchant, tier, scoring, credit_offer, insurance_offer, benchmark
  );

  const result = await upsert_underwriting_result({
    merchant_id: merchant.merchant_id,
    merchant_name: merchant.name,
    risk_tier: tier,
    scoring,
    credit_offer,
    insurance_offer,
    credit_rationale: mode === "credit" ? output.analyst_explanation : "",
    credit_user_message: mode === "credit" ? output.user_message : "",
    insurance_rationale: mode === "insurance" ? output.analyst_explanation : "",
    insurance_user_message: mode === "insurance" ? output.user_message : "",
    offer_status: "underwritten",
    whatsapp_status: "not_sent",
    timestamp: new Date().toISOString(),
  });

  // 5. Return result
  res.status(HTTP.OK).json({ result });
};

const generate_rationale = async (
  mode: TUnderWritingMode,
  merchant: TMerchantProfile,
  tier: TRiskTier,
  scoring: TScoringBreakdown,
  credit_offer: TCreditOffer | null,
  insurance_offer: TInsuranceOffer | null,
  benchmark: TCategoryBenchmark
): Promise<TRationaleOutput> => {
  const prompt = build_rationale_prompt(mode, merchant, tier, scoring, credit_offer, insurance_offer, benchmark);

  try {
    return await generate_object({
      models: RATIONALE_MODELS,
      system: RATIONALE_SYSTEM_PROMPT,
      prompt,
      schema: ZRationaleOutput,
      max_tokens: AI_SERVICE.MAX_OUTPUT_TOKENS,
      temperature: AI_SERVICE.TEMPERATURE,
    });
  } catch (err) {
    console.error("[underwrite] AI generation failed, using fallback:", err);
    return build_fallback_rationale(mode, merchant, tier, scoring, credit_offer, insurance_offer);
  }
};

const build_fallback_rationale = (
  mode: TUnderWritingMode,
  merchant: TMerchantProfile,
  tier: TRiskTier,
  scoring: TScoringBreakdown,
  credit_offer: TCreditOffer | null,
  insurance_offer: TInsuranceOffer | null
): TRationaleOutput => {
  if (!scoring.pre_filter_passed) {
    const msg = `Hi ${merchant.name}, unfortunately your profile doesn't meet our minimum eligibility criteria right now. ${scoring.pre_filter_reason ?? "Keep growing on the platform and reapply in a few months!"}`;
    return {
      user_message: msg,
      analyst_explanation: `${merchant.name} did not qualify for a pre-approved offer. ${scoring.pre_filter_reason ?? "The merchant profile does not meet minimum eligibility criteria."}. We encourage the merchant to continue growing on the platform and reapply once the highlighted criteria are met.`,
    };
  }

  if (tier === "rejected") {
    return {
      user_message: `Hi ${merchant.name}, your composite risk score of ${scoring.composite_score}/100 fell below our minimum threshold. Your customer return rate of ${(merchant.customer_return_rate * 100).toFixed(1)}% and refund rate of ${(merchant.return_and_refund_rate * 100).toFixed(1)}% were key factors. We'll re-evaluate quarterly!`,
      analyst_explanation: `${merchant.name} passed initial eligibility checks but received a composite risk score of ${scoring.composite_score}/100, below the minimum threshold of 30. The primary drag was low customer loyalty (${(merchant.customer_return_rate * 100).toFixed(1)}%) and elevated refund rates (${(merchant.return_and_refund_rate * 100).toFixed(1)}%). We recommend improving platform engagement and reducing refunds over the next 3-6 months before reapplying.`,
    };
  }

  if (mode === "credit" && credit_offer) {
    return {
      user_message: `Great news, ${merchant.name}! You've been pre-approved for a GrabCredit working capital loan. Your strong customer return rate of ${(merchant.customer_return_rate * 100).toFixed(1)}% helped you qualify. Reply ACCEPT to proceed!`,
      analyst_explanation: `${merchant.name} has been approved for a working capital credit limit of Rs.${(credit_offer.credit_limit_inr / 100_000).toFixed(1)}L at ${credit_offer.interest_rate_percent}% p.a. under ${tier.replace("_", " ")} (composite score: ${scoring.composite_score}/100). The merchant demonstrates a customer return rate of ${(merchant.customer_return_rate * 100).toFixed(1)}% and a refund rate of ${(merchant.return_and_refund_rate * 100).toFixed(1)}%, reflecting demand stability and product quality.`,
    };
  }

  if (mode === "insurance" && insurance_offer) {
    return {
      user_message: `Great news, ${merchant.name}! You're eligible for a GrabInsurance business cover with Rs.${(insurance_offer.coverage_amount_inr / 100_000).toFixed(1)}L coverage. Reply ACCEPT to activate your policy!`,
      analyst_explanation: `${merchant.name} has been approved for ${insurance_offer.policy_type} with Rs.${(insurance_offer.coverage_amount_inr / 100_000).toFixed(1)}L coverage at Rs.${(insurance_offer.annual_premium_inr / 1_000).toFixed(1)}K annual premium under ${tier.replace("_", " ")} (composite score: ${scoring.composite_score}/100).`,
    };
  }

  return {
    user_message: "We encountered an issue generating your offer. Our team will reach out shortly.",
    analyst_explanation: "Rationale could not be generated. Please contact support.",
  };
};
