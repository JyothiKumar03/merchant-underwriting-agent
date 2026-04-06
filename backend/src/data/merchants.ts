import { ENV } from "../constants/env.js";
import type { TMerchantProfile } from "../types/index.js";

export const merchants: TMerchantProfile[] = [
  //  TIER 1 (MER_001 – MER_003)

  {
    merchant_id: "MER_001",
    name: "StyleKraft Fashion",
    category: "fashion_beauty",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 18,
    total_deals_listed: 142,
    monthly_gmv_12m: [
      1840000, 1920000, 2010000, 1980000, 2150000, 2280000,
      2340000, 2100000, 2450000, 2520000, 2480000, 2540000,
    ],
    coupon_redemption_rate: 0.68,
    unique_customer_count: 12400,
    customer_return_rate: 0.71,
    avg_order_value: 2850,
    seasonality_index: 1.38,
    deal_exclusivity_rate: 0.45,
    return_and_refund_rate: 0.021,
  },

  {
    merchant_id: "MER_002",
    name: "WellnessFirst Pharmacy",
    category: "health_wellness",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 24,
    total_deals_listed: 198,
    monthly_gmv_12m: [
      620000, 640000, 680000, 650000, 700000, 710000,
      690000, 720000, 740000, 730000, 760000, 780000,
    ],
    coupon_redemption_rate: 0.73,
    unique_customer_count: 8900,
    customer_return_rate: 0.82,
    avg_order_value: 1450,
    seasonality_index: 1.26,
    deal_exclusivity_rate: 0.55,
    return_and_refund_rate: 0.012,
  },

  {
    merchant_id: "MER_003",
    name: "Wanderlust Holidays",
    category: "travel",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 20,
    total_deals_listed: 165,
    monthly_gmv_12m: [
      1100000, 850000, 920000, 1350000, 1580000, 1620000,
      1240000, 1050000, 1380000, 1650000, 1720000, 1800000,
    ],
    coupon_redemption_rate: 0.61,
    unique_customer_count: 6200,
    customer_return_rate: 0.64,
    avg_order_value: 8500,
    seasonality_index: 2.12,
    deal_exclusivity_rate: 0.5,
    return_and_refund_rate: 0.025,
  },

  //  TIER 2 (MER_004 – MER_005)

  {
    merchant_id: "MER_004",
    name: "TechNova Electronics",
    category: "electronics",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 14,
    total_deals_listed: 87,
    monthly_gmv_12m: [
      890000, 920000, 850000, 910000, 780000, 950000,
      1020000, 980000, 1100000, 1050000, 1120000, 1080000,
    ],
    coupon_redemption_rate: 0.52,
    unique_customer_count: 5800,
    customer_return_rate: 0.48,
    avg_order_value: 7200,
    seasonality_index: 1.44,
    deal_exclusivity_rate: 0.2,
    return_and_refund_rate: 0.058,
  },

  {
    merchant_id: "MER_005",
    name: "FreshBasket Groceries",
    category: "food_delivery",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 12,
    total_deals_listed: 95,
    monthly_gmv_12m: [
      520000, 540000, 560000, 530000, 580000, 600000,
      610000, 590000, 620000, 640000, 650000, 660000,
    ],
    coupon_redemption_rate: 0.58,
    unique_customer_count: 7100,
    customer_return_rate: 0.53,
    avg_order_value: 450,
    seasonality_index: 1.27,
    deal_exclusivity_rate: 0.25,
    return_and_refund_rate: 0.038,
  },

  //  TIER 3 (MER_006 – MER_007) 

  {
    merchant_id: "MER_006",
    name: "QuickBite Delivery",
    category: "food_delivery",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 11,
    total_deals_listed: 54,
    monthly_gmv_12m: [
      320000, 380000, 290000, 420000, 510000, 710000,
      340000, 280000, 450000, 390000, 190000, 420000,
    ],
    coupon_redemption_rate: 0.41,
    unique_customer_count: 3200,
    customer_return_rate: 0.39,
    avg_order_value: 680,
    seasonality_index: 3.74,
    deal_exclusivity_rate: 0.1,
    return_and_refund_rate: 0.063,
  },

  {
    merchant_id: "MER_007",
    name: "UrbanEscape Tours",
    category: "travel",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 8,
    total_deals_listed: 32,
    monthly_gmv_12m: [
      0, 0, 0, 0, 210000, 380000,
      290000, 450000, 310000, 180000, 520000, 340000,
    ],
    coupon_redemption_rate: 0.35,
    unique_customer_count: 1800,
    customer_return_rate: 0.31,
    avg_order_value: 5200,
    seasonality_index: 2.89,
    deal_exclusivity_rate: 0.08,
    return_and_refund_rate: 0.072,
  },

  //  REJECTIONS (MER_008 – MER_010) 

  // Pre-filter reject: < 6 months on platform
  {
    merchant_id: "MER_008",
    name: "NewTrend Accessories",
    category: "fashion_beauty",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 3,
    total_deals_listed: 12,
    monthly_gmv_12m: [
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 85000, 110000, 130000,
    ],
    coupon_redemption_rate: 0.22,
    unique_customer_count: 420,
    customer_return_rate: 0.23,
    avg_order_value: 1200,
    seasonality_index: 1.53,
    deal_exclusivity_rate: 0.05,
    return_and_refund_rate: 0.089,
  },

  // Pre-filter reject: refund rate > 10%
  {
    merchant_id: "MER_009",
    name: "GadgetZone Express",
    category: "electronics",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 9,
    total_deals_listed: 28,
    monthly_gmv_12m: [
      0, 0, 0, 180000, 220000, 310000,
      280000, 250000, 190000, 160000, 140000, 120000,
    ],
    coupon_redemption_rate: 0.29,
    unique_customer_count: 950,
    customer_return_rate: 0.21,
    avg_order_value: 4800,
    seasonality_index: 2.58,
    deal_exclusivity_rate: 0.05,
    return_and_refund_rate: 0.112,
  },

  // Scoring reject: passes pre-filter but composite score < 30
  {
    merchant_id: "MER_010",
    name: "GlowUp Beauty",
    category: "fashion_beauty",
    contact_whatsapp: ENV.TWILIO_WHATSAPP_TO,
    months_on_platform: 7,
    total_deals_listed: 22,
    monthly_gmv_12m: [
      0, 0, 0, 0, 0, 60000,
      55000, 48000, 42000, 38000, 35000, 30000,
    ],
    coupon_redemption_rate: 0.18,
    unique_customer_count: 310,
    customer_return_rate: 0.15,
    avg_order_value: 980,
    seasonality_index: 2.0,
    deal_exclusivity_rate: 0.04,
    return_and_refund_rate: 0.095,
  },
];

export const get_all_static_merchants = (): TMerchantProfile[] => merchants;

export const get_merchant_by_id = (id: string): TMerchantProfile | undefined =>
  merchants.find((m) => m.merchant_id === id);
