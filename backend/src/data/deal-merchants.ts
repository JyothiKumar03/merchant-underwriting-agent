export type TDealMerchant = {
  merchant_id: string;
  name: string;
  logo_url: string;
  primary_category: string;
  base_url: string;
};

export const DEAL_MERCHANTS: Record<string, TDealMerchant> = {
  "zomato-001": {
    merchant_id: "zomato-001",
    name: "Zomato",
    logo_url: "https://logo.clearbit.com/zomato.com",
    primary_category: "Food & Dining",
    base_url: "https://www.zomato.com",
  },
  "swiggy-001": {
    merchant_id: "swiggy-001",
    name: "Swiggy",
    logo_url: "https://logo.clearbit.com/swiggy.com",
    primary_category: "Food & Dining",
    base_url: "https://www.swiggy.com",
  },
  "myntra-001": {
    merchant_id: "myntra-001",
    name: "Myntra",
    logo_url: "https://logo.clearbit.com/myntra.com",
    primary_category: "Fashion & Lifestyle",
    base_url: "https://www.myntra.com",
  },
  "blinkit-001": {
    merchant_id: "blinkit-001",
    name: "Blinkit",
    logo_url: "https://logo.clearbit.com/blinkit.com",
    primary_category: "Grocery & Instant Delivery",
    base_url: "https://www.blinkit.com",
  },
};

export const SAMPLE_DEALS = [
  {
    merchant_id: "zomato-001",
    category: "Food & Dining",
    discount_value: 40,
    discount_type: "percentage" as const,
    expiry_timestamp: "2026-04-15T23:59:59Z",
    min_order_value: 349,
    max_redemptions: 5000,
    exclusive_flag: true,
  },
  {
    merchant_id: "swiggy-001",
    category: "Food & Dining",
    discount_value: 50,
    discount_type: "percentage" as const,
    expiry_timestamp: "2026-04-20T23:59:59Z",
    min_order_value: 199,
    max_redemptions: 10000,
    exclusive_flag: false,
  },
  {
    merchant_id: "myntra-001",
    category: "Fashion & Lifestyle",
    discount_value: 60,
    discount_type: "percentage" as const,
    expiry_timestamp: "2026-04-12T23:59:59Z",
    min_order_value: 999,
    max_redemptions: 2500,
    exclusive_flag: true,
  },
] as const;

export const get_deal_merchant = (merchant_id: string): TDealMerchant | null =>
  DEAL_MERCHANTS[merchant_id] ?? null;
