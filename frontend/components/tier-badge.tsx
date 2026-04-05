import { cn } from "@/lib/utils";
import { RISK_TIER_LABELS } from "@/constants";
import type { TRiskTier } from "@/types";

const TIER_STYLES: Record<TRiskTier, string> = {
  tier_1:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  tier_2:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  tier_3:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

type TierBadgeProps = {
  tier: TRiskTier;
  className?: string;
};

export const TierBadge = ({ tier, className }: TierBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
      TIER_STYLES[tier],
      className
    )}
  >
    {RISK_TIER_LABELS[tier]}
  </span>
);
