import type { CategoryBenchmark } from "../types/index.js";

export const CATEGORY_BENCHMARKS: Record<string, CategoryBenchmark> = {
  "Fashion & Beauty": {
    avg_return_rate: 0.52,
    avg_refund_rate: 0.048,
    avg_monthly_gmv: 1200000,
    avg_order_value: 2200,
  },
  Electronics: {
    avg_return_rate: 0.41,
    avg_refund_rate: 0.042,
    avg_monthly_gmv: 950000,
    avg_order_value: 6500,
  },
  "Food & Delivery": {
    avg_return_rate: 0.45,
    avg_refund_rate: 0.041,
    avg_monthly_gmv: 800000,
    avg_order_value: 550,
  },
  "Health & Wellness": {
    avg_return_rate: 0.58,
    avg_refund_rate: 0.032,
    avg_monthly_gmv: 700000,
    avg_order_value: 1200,
  },
  Travel: {
    avg_return_rate: 0.35,
    avg_refund_rate: 0.055,
    avg_monthly_gmv: 1500000,
    avg_order_value: 7500,
  },
};

export function getBenchmark(category: string): CategoryBenchmark {
  const benchmark = CATEGORY_BENCHMARKS[category];
  if (!benchmark) {
    // Fallback to conservative defaults for unknown categories
    return {
      avg_return_rate: 0.45,
      avg_refund_rate: 0.05,
      avg_monthly_gmv: 800000,
      avg_order_value: 2000,
    };
  }
  return benchmark;
}
