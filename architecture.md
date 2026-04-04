# Architecture — AI Merchant Underwriting Agent

**GrabCredit × GrabInsurance | GrabOn Vibe Coder Challenge 2025**

---

## 1. What This Is

Dashboard that scores 10 GrabOn merchants for credit risk, generates a working-capital loan offer (GrabCredit) OR a business-interruption insurance offer (GrabInsurance) based on a **mode toggle in the UI**, explains the decision via Claude, and delivers offers over WhatsApp.

**Core principle:** *Code decides, Claude explains.* Scoring and offers are deterministic. Claude only writes the rationale.

---

## 2. Tech Stack

| Layer      | Choice                                 |
| ---------- | -------------------------------------- |
| Runtime    | Node.js 20 + TypeScript                |
| Framework  | Next.js 15 (App Router) — fullstack    |
| Database   | PostgreSQL via `postgres` (tagged SQL)  |
| AI         | `@anthropic-ai/sdk` → Claude Sonnet    |
| Messaging  | `twilio` (WhatsApp Sandbox — freeform)  |
| UI         | shadcn/ui + Tailwind CSS               |

---

## 3. System Flow

```
UI: User selects mode [GrabCredit | GrabInsurance] via toggle
UI: User clicks [Underwrite] on a merchant row
        │
        ▼
  POST /api/underwrite/:id  { mode: "credit" | "insurance" }
        │
        ▼
  ┌─ PRE-FILTER GATE ─┐
  │  Hard reject?      │──YES──▶ Return REJECTED + reason (skip scoring)
  └────────┬───────────┘
           │ NO
           ▼
  ┌─ SCORING ENGINE ───────────────────────────┐
  │  5 sub-scores → weighted composite → Tier  │
  │  (mode-independent — same score either way) │
  └────────┬───────────────────────────────────┘
           │
           ▼
  ┌─ OFFER CALCULATOR ─────────────────────────┐
  │  Compute BOTH credit + insurance offers     │
  │  (pure math, instant, always both)          │
  └────────┬───────────────────────────────────┘
           │
           ▼
  ┌─ CLAUDE API — ONE call ────────────────────┐
  │  Generate rationale for the SELECTED mode   │
  └────────┬───────────────────────────────────┘
           │
           ▼
  Store result in DB → Return to frontend
  Dashboard shows: tier + scores + selected mode's offer card + rationale
        │
        ├──▶ User switches mode in UI
        │    → if other rationale is empty in DB, fire another
        │      POST /api/underwrite/:id with new mode
        │      (scoring is cached — only Claude call runs)
        │
        ├──▶ [Send via WhatsApp] → POST /api/send-offer
        └──▶ [Accept Offer] → POST /api/accept-offer
```

**Why one Claude call, not two:** Mode comes from UI. Generate only the rationale user is looking at. If they switch modes and other rationale is empty, fire one more call — no re-scoring.

**Why compute both offers anyway:** Offer math is instant. Store both so table columns can show amounts regardless of active mode. Only the rationale is mode-gated.

---

## 4. Input Data

### Merchant Profile (10 hardcoded records)

| Field                    | Type       | Description                                           |
| ------------------------ | ---------- | ----------------------------------------------------- |
| `merchant_id`            | string     | `MER_001` through `MER_010`                           |
| `name`                   | string     | Business name                                         |
| `category`               | string     | Fashion & Beauty · Electronics · Food & Delivery · Health & Wellness · Travel |
| `contact_whatsapp`       | string     | E.164 format                                          |
| `months_on_platform`     | number     | 0–36                                                  |
| `total_deals_listed`     | number     | Lifetime deal count                                   |
| `monthly_gmv_12m`        | number[12] | 12 months GMV in ₹. Leading zeros for new merchants.  |
| `coupon_redemption_rate` | 0–1        | Coupons redeemed / coupons issued                     |
| `unique_customer_count`  | number     | Distinct buyers                                       |
| `customer_return_rate`   | 0–1        | Repeat buyer fraction                                 |
| `avg_order_value`        | number     | ₹                                                     |
| `seasonality_index`      | number     | peak_gmv / trough_gmv. 1.0 = stable, 3.0+ = volatile |
| `deal_exclusivity_rate`  | 0–1        | GrabOn-exclusive deals fraction                       |
| `return_and_refund_rate` | 0–1        | Orders refunded fraction                              |

### Category Benchmarks (5 static rows)

| Category           | avg_return_rate | avg_refund_rate | avg_monthly_gmv | avg_order_value |
| ------------------ | --------------- | --------------- | --------------- | --------------- |
| Fashion & Beauty   | 0.52            | 0.048           | 12,00,000       | 2,200           |
| Electronics        | 0.41            | 0.042           | 9,50,000        | 6,500           |
| Food & Delivery    | 0.45            | 0.041           | 8,00,000        | 550             |
| Health & Wellness  | 0.58            | 0.032           | 7,00,000        | 1,200           |
| Travel             | 0.35            | 0.055           | 15,00,000       | 7,500           |

---

## 5. Pre-Filter Gate

Hard reject. ANY failure → instant `Rejected`, no scoring.

| Check             | Threshold  | Message                                      |
| ----------------- | ---------- | -------------------------------------------- |
| Platform tenure   | < 6 months | "Insufficient tenure: {n} months (min 6)"    |
| Avg monthly GMV   | < ₹50,000  | "Avg GMV ₹{x}L below minimum ₹0.5L"         |
| Refund rate       | > 10%      | "Refund rate {x}% exceeds 10% threshold"     |

GMV average = mean of **non-zero months only**.

---

## 6. Scoring Engine

### Sub-Scores (each 0–100)

| Score        | Weight | Input                                  | Logic                                                        |
| ------------ | ------ | -------------------------------------- | ------------------------------------------------------------ |
| GMV Growth   | 25%    | `monthly_gmv_12m`                      | Avg first half vs second half of non-zero months. Positive growth → high. |
| Stability    | 20%    | `monthly_gmv_12m`                      | Coefficient of variation. Low CV → high score.                |
| Loyalty      | 20%    | `customer_return_rate` vs benchmark    | merchant / category_avg. Higher ratio → higher.               |
| Quality      | 20%    | `return_and_refund_rate` vs benchmark  | merchant / category_avg. **Lower** ratio → higher.            |
| Engagement   | 15%    | redemption, exclusivity, tenure        | 40% redemption + 30% exclusivity + 30% capped tenure.        |

### Composite → Tier

`composite = growth×0.25 + stability×0.20 + loyalty×0.20 + quality×0.20 + engagement×0.15`

| Composite | Tier       | Notes                                       |
| --------- | ---------- | ------------------------------------------- |
| ≥ 75      | Tier 1     | Best rates                                  |
| ≥ 50      | Tier 2     | Standard rates                              |
| ≥ 30      | Tier 3     | Restricted + "Manual Review Recommended"    |
| < 30      | Rejected   | Scoring reject — data too weak              |

### Validation Targets

| Merchant               | Expected                | Why                                  |
| ---------------------- | ----------------------- | ------------------------------------ |
| StyleKraft Fashion     | Tier 1                  | Strong growth, 71% loyalty, 2.1% refunds |
| WellnessFirst Pharmacy | Tier 1                  | Ultra-stable, 82% loyalty            |
| Wanderlust Holidays    | Tier 1                  | Growing despite seasonality          |
| TechNova Electronics   | Tier 2                  | 5.8% refunds, low exclusivity       |
| FreshBasket Groceries  | Tier 2                  | Steady but unexceptional             |
| QuickBite Delivery     | Tier 3                  | 3.74 seasonality, 6.3% refunds      |
| UrbanEscape Tours      | Tier 3                  | Volatile, 31% loyalty                |
| NewTrend Accessories   | Rejected (pre-filter)   | 3 months tenure                      |
| GadgetZone Express     | Rejected (pre-filter)   | 11.2% refund rate                    |
| GlowUp Beauty          | Rejected (scoring)      | Composite < 30                       |

---

## 7. Offer Formulas

Always compute **both** (pure math, instant). Only rationale is mode-gated.

### Credit (GrabCredit)

`credit_limit = min(avg_monthly_gmv × multiplier, max_limit)`

| Tier   | Multiplier | Rate       | Tenures         | Max Limit   |
| ------ | ---------- | ---------- | --------------- | ----------- |
| Tier 1 | 6×         | 14.5% p.a. | 6 / 12 / 18 mo | ₹50,00,000  |
| Tier 2 | 4×         | 16.5% p.a. | 6 / 12 mo      | ₹20,00,000  |
| Tier 3 | 2×         | 19.5% p.a. | 6 mo            | ₹5,00,000   |

### Insurance (GrabInsurance)

`coverage = avg_monthly_gmv × 3`
`annual_premium = coverage × risk_factor × tier_multiplier`
`quarterly_premium = annual / 4`

| Category           | Policy Type                                  | Risk Factor |
| ------------------ | -------------------------------------------- | ----------- |
| Fashion & Beauty   | Inventory Protection + Business Interruption | 0.025       |
| Electronics        | Inventory Protection + Transit Damage        | 0.030       |
| Food & Delivery    | Business Interruption + Liability            | 0.035       |
| Health & Wellness  | Business Interruption + Compliance           | 0.020       |
| Travel             | Business Interruption + Cancellation         | 0.028       |

Tier premium multiplier: Tier 1 = 0.85, Tier 2 = 1.00, Tier 3 = 1.20.

---

## 8. Claude Integration

**One call per mode per merchant.** Not parallel.

**Input to Claude:** merchant profile, all 5 sub-scores + composite, tier, the calculated offer for that mode, category benchmark.

**Output:** 3–5 sentence plain text rationale. No JSON, no bullets. Must reference specific numbers.

**Caching logic:** If user switches mode and the other rationale already exists in DB → serve from DB. If empty → call Claude once, patch the row.

---

## 9. Database Schema

### `underwriting_results` — one row per merchant, upserted

| Column                 | Type          | Notes                                                    |
| ---------------------- | ------------- | -------------------------------------------------------- |
| `id`                   | SERIAL PK     |                                                          |
| `merchant_id`          | VARCHAR(20)   | UNIQUE                                                   |
| `merchant_name`        | VARCHAR(255)  |                                                          |
| `risk_tier`            | VARCHAR(20)   | `Tier 1` · `Tier 2` · `Tier 3` · `Rejected`             |
| `scoring`              | JSONB         | All sub-scores + composite + pre_filter fields           |
| `credit_offer`         | JSONB / NULL  |                                                          |
| `insurance_offer`      | JSONB / NULL  |                                                          |
| `credit_rationale`     | TEXT          | Empty until credit mode is run                           |
| `insurance_rationale`  | TEXT          | Empty until insurance mode is run                        |
| `offer_status`         | VARCHAR(25)   | `not_underwritten` → `underwritten` → `offer_sent` → `mandate_active` |
| `whatsapp_status`      | VARCHAR(10)   | `not_sent` / `sent` / `failed`                           |
| `whatsapp_message_sid` | VARCHAR(64)   |                                                          |
| `nach_umrn`            | VARCHAR(64)   |                                                          |
| `created_at`           | TIMESTAMPTZ   |                                                          |
| `updated_at`           | TIMESTAMPTZ   |                                                          |

### `whatsapp_logs` — one row per send attempt (audit trail)

| Column          | Type         | Notes                          |
| --------------- | ------------ | ------------------------------ |
| `id`            | SERIAL PK    |                                |
| `merchant_id`   | VARCHAR(20)  |                                |
| `message_sid`   | VARCHAR(64)  | Nullable                       |
| `to_number`     | VARCHAR(20)  |                                |
| `message_body`  | TEXT         |                                |
| `mode`          | VARCHAR(10)  | `credit` / `insurance`         |
| `status`        | VARCHAR(10)  | `not_sent` / `sent` / `failed` |
| `error_message` | TEXT         | Nullable                       |
| `sent_at`       | TIMESTAMPTZ  |                                |

---

## 10. APIs

---

### `GET /api/merchants`

Returns all 10 merchant profiles joined with any existing underwriting results.

**Response:**
```json
{
  "merchants": [
    {
      "...MerchantProfile fields",
      "result": "UnderwritingResult | null"
    }
  ]
}
```

Dashboard calls on mount. Hydrates table with any previously underwritten results.

---

### `POST /api/underwrite/:id`

Scores merchant, computes both offers, calls Claude once for selected mode.

**Request body:**
```json
{ "mode": "credit" | "insurance" }
```

**Backend logic:**
1. Find merchant → 404 if missing
2. Look up category benchmark → 400 if unknown
3. Check DB for existing result:
   - **Exists + has rationale for this mode** → return cached result (no work)
   - **Exists + missing rationale for this mode** → skip scoring/offers, call Claude for this mode only, patch row
   - **Does not exist** → run full pipeline: pre-filter → scoring → both offers → Claude (one mode) → insert row
4. Return result

**Response:**
```json
{
  "result": {
    "merchant_id": "MER_001",
    "merchant_name": "StyleKraft Fashion",
    "risk_tier": "Tier 1",
    "scoring": {
      "pre_filter_passed": true,
      "gmv_growth_score": 73.0,
      "stability_score": 85.0,
      "loyalty_score": 72.0,
      "quality_score": 82.0,
      "engagement_score": 68.0,
      "composite_score": 76.3
    },
    "credit_offer": {
      "credit_limit_inr": 5000000,
      "interest_rate_percent": 14.5,
      "tenure_options_months": [6, 12, 18]
    },
    "insurance_offer": {
      "coverage_amount_inr": 6780000,
      "annual_premium_inr": 17265,
      "quarterly_premium_inr": 4316,
      "policy_type": "Inventory Protection + Business Interruption"
    },
    "credit_rationale": "StyleKraft demonstrates...",
    "insurance_rationale": "",
    "offer_status": "underwritten",
    "whatsapp_status": "not_sent"
  }
}
```

`insurance_rationale` is empty because mode was `"credit"`. When user switches tab → frontend sees empty rationale → fires `POST /api/underwrite/MER_001 { mode: "insurance" }` → backend skips scoring, calls Claude, fills rationale, returns.

---

### `POST /api/send-offer`

Sends WhatsApp via Twilio for selected mode.

**Request body:**
```json
{ "merchantId": "MER_001", "mode": "credit" | "insurance" }
```

**Backend logic:**
1. Look up result from DB → 404 if not underwritten
2. Look up merchant for WhatsApp number
3. Compose message (credit template / insurance template / rejection template)
4. Call `twilio.messages.create()`
5. Insert row into `whatsapp_logs`
6. Update `whatsapp_status` + `offer_status` on `underwriting_results`

**Response:**
```json
{ "whatsapp_status": "sent", "message_sid": "SM..." }
```

---

### `POST /api/accept-offer`

Mock NACH mandate.

**Request body:**
```json
{ "merchantId": "MER_001" }
```

**Backend logic:**
1. Look up result → 404 if missing, 400 if rejected
2. Generate UMRN: `GRAB-NACH-{merchant_id}-{timestamp}`
3. Update: `offer_status = 'mandate_active'`, store UMRN

**Response:**
```json
{ "offer_status": "mandate_active", "nach_umrn": "GRAB-NACH-MER_001-1712234567890" }
```

---

## 11. UI Behavior

### Mode Toggle

Top of dashboard: `[GrabCredit]` / `[GrabInsurance]` tab switch. Controls:
- Which rationale is shown in detail panel
- Which "Send via WhatsApp" fires
- Which offer card is primary (both amounts always visible in table)

### Status Badges

| Status         | Color  |
| -------------- | ------ |
| Pending        | Gray   |
| Underwritten   | Blue   |
| Offer Sent     | Yellow |
| Mandate Active | Green  |
| Rejected       | Red    |

Tier 3 rows additionally show **"Manual Review Recommended"** badge.

### Status Flow

```
Pending ──[Underwrite]──▶ Underwritten ──[Send WhatsApp]──▶ Offer Sent ──[Accept]──▶ Mandate Active
                              │
                              └── Rejected ──[Send WhatsApp]──▶ Rejection Sent
```

---

## 12. Environment

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgres://user:pass@host:5432/grabcredit
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```