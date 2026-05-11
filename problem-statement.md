# AI Merchant Underwriting Agent

## Problem

Merchant partners on a rewards platform generate rich behavioral data — 12 months of GMV, transaction velocity, deal redemption quality, customer return rates — that traditional financial institutions don't have access to. This data advantage enables a platform to assess merchants for embedded financial products: working capital credit and business interruption insurance.

The challenge is building an underwriting agent that turns raw platform data into explainable, pre-approved offers delivered directly to merchants.

---

## What to Build

An AI agent that assesses merchant partners for embedded credit limits and insurance coverage, generating explainable pre-approved offers delivered via WhatsApp.

**Core capabilities:**

- Comprehensive merchant profile schema: `merchant_id`, `category`, `monthly_gmv_12m` (array), `coupon_redemption_rate`, `unique_customer_count`, `customer_return_rate`, `avg_order_value`, `seasonality_index`, `deal_exclusivity_rate`, `return_and_refund_rate`
- Two underwriting modes: **Credit** (working capital credit limit, interest rate tier, tenure options) and **Insurance** (business interruption coverage amount, premium quote, policy type)
- Fully explainable decisions: every offer includes a rationale that references specific data points — *"We are offering ₹15L at Tier 2 rates because your GMV has grown 38% YoY, your customer return rate of 71% indicates demand stability, and your refund rate of 2.1% is below the category average of 4.8%"*
- Risk tiering: Tier 1 (low risk, best rates), Tier 2 (moderate risk, standard rates), Tier 3 (high risk, manual review required)
- WhatsApp delivery via Twilio: pre-approved offer messages formatted as proper business notifications
- Merchant dashboard: offer status, credit limit, insurance quote, risk tier, one-click Accept Offer flow with mock NACH mandate

---

## Scope

Process 10 diverse merchant profiles covering Tier 1 through Tier 3 outcomes, different categories, and at least 2 rejection scenarios with clear explanations. Demonstrate live WhatsApp offer delivery for at least 2 merchants.

---

## Evaluation Criteria

- Risk tiering logic is coherent and data-driven — edge cases must be handled correctly
- Explainability narratives reference actual data points, not template text
- WhatsApp integration is functional (sandbox acceptable, must show real message delivery)
- Dashboard clearly shows the full underwriting decision trail for each merchant
