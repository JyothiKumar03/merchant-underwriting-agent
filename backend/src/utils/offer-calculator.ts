import type { TMerchantProfile, TRiskTier, TCreditOffer, TInsuranceOffer } from "../types/index.js";
import {
  CREDIT_CONFIG,
  INSURANCE_CATEGORY_CONFIG,
  INSURANCE_COVERAGE_MONTHS,
  TIER_PREMIUM_MULTIPLIER,
} from "../constants/index.js";



export const calc_credit_offer = (
  merchant: TMerchantProfile,
  tier: Exclude<TRiskTier, "rejected">
): TCreditOffer => {
  const config = CREDIT_CONFIG[tier];
  const avg_gmv = non_zero_avg(merchant.monthly_gmv_12m);
  const credit_limit_inr = Math.min(avg_gmv * config.multiplier, config.max_credit_inr);

  return {
    credit_limit_inr: Math.round(credit_limit_inr),
    interest_rate_percent: config.interest_rate_percent,
    tenure_options_months: config.tenure_options_months,
  };
};

export const calc_insurance_offer = (
  merchant: TMerchantProfile,
  tier: Exclude<TRiskTier, "rejected">
): TInsuranceOffer => {
  const category_config = INSURANCE_CATEGORY_CONFIG[merchant.category];
  const tier_multiplier = TIER_PREMIUM_MULTIPLIER[tier];
  const avg_gmv = non_zero_avg(merchant.monthly_gmv_12m);

  const coverage_amount_inr = Math.round(avg_gmv * INSURANCE_COVERAGE_MONTHS);
  const annual_premium_inr = Math.round(
    coverage_amount_inr * category_config.risk_factor * tier_multiplier
  );
  const quarterly_premium_inr = Math.round(annual_premium_inr / 4);

  return {
    coverage_amount_inr,
    annual_premium_inr,
    quarterly_premium_inr,
    policy_type: category_config.policy_type,
  };
};

export type TOfferPair = {
  credit_offer: TCreditOffer | null;
  insurance_offer: TInsuranceOffer | null;
};

export const calc_both_offers = (
  merchant: TMerchantProfile,
  tier: TRiskTier
): TOfferPair => {
  if (tier === "rejected") {
    return { credit_offer: null, insurance_offer: null };
  }

  return {
    credit_offer: calc_credit_offer(merchant, tier),
    insurance_offer: calc_insurance_offer(merchant, tier),
  };
};

const non_zero_avg = (monthly_gmv_12m: number[]): number => {
  const non_zero = monthly_gmv_12m.filter((v) => v > 0);
  if (non_zero.length === 0) return 0;
  return non_zero.reduce((a, b) => a + b, 0) / non_zero.length;
};