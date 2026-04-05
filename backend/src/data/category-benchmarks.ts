import type { CategoryBenchmark, TCategory } from "../types/index.js";

export const CATEGORY_BENCHMARKS: Record<TCategory, CategoryBenchmark> = {
  "fashion_beauty": {
    avg_return_rate: 0.52,
    avg_refund_rate: 0.048,
    avg_monthly_gmv: 1200000,
    avg_order_value: 2200,
  },
  "electronics": {
    avg_return_rate: 0.41,
    avg_refund_rate: 0.042,
    avg_monthly_gmv: 950000,
    avg_order_value: 6500,
  },
  "food_delivery": {
    avg_return_rate: 0.45,
    avg_refund_rate: 0.041,
    avg_monthly_gmv: 800000,
    avg_order_value: 550,
  },
  "health_wellness": {
    avg_return_rate: 0.58,
    avg_refund_rate: 0.032,
    avg_monthly_gmv: 700000,
    avg_order_value: 1200,
  },
  "travel": {
    avg_return_rate: 0.35,
    avg_refund_rate: 0.055,
    avg_monthly_gmv: 1500000,
    avg_order_value: 7500,
  },
};

export function get_category_benchmark(category: TCategory): CategoryBenchmark {
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
