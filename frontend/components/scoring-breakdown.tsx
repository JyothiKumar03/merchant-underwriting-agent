import { cn } from "@/lib/utils";
import { ScoreBar } from "@/components/score-bar";
import { TierBadge } from "@/components/tier-badge";
import type { TScoringBreakdown, TRiskTier } from "@/types";

type ScoringBreakdownProps = {
  scoring: TScoringBreakdown;
  tier: TRiskTier;
  className?: string;
};

const COMPOSITE_COLOR = (score: number): string => {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-blue-600 dark:text-blue-400";
  if (score >= 30) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export const ScoringBreakdown = ({
  scoring,
  tier,
  className,
}: ScoringBreakdownProps) => {
  if (!scoring.pre_filter_passed) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950/30",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🚫</span>
          <div>
            <p className="font-semibold text-red-700 dark:text-red-400">
              Pre-filter Failed
            </p>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-0.5">
              {scoring.pre_filter_reason ?? "Does not meet minimum eligibility criteria"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      {/* Composite score + tier */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            Composite Score
          </p>
          <p
            className={cn(
              "text-4xl font-bold tabular-nums",
              COMPOSITE_COLOR(scoring.composite_score)
            )}
          >
            {scoring.composite_score.toFixed(1)}
            <span className="text-lg font-normal text-muted-foreground">/100</span>
          </p>
        </div>
        <div className="text-right space-y-2">
          <TierBadge tier={tier} />
          {tier === "tier_3" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Manual Review Recommended
            </p>
          )}
        </div>
      </div>

      {/* Sub-scores */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Score Breakdown
        </p>
        <ScoreBar label="GMV Growth" score={scoring.gmv_growth_score} weight="25%" />
        <ScoreBar label="Stability" score={scoring.stability_score} weight="20%" />
        <ScoreBar label="Loyalty" score={scoring.loyalty_score} weight="20%" />
        <ScoreBar label="Quality" score={scoring.quality_score} weight="20%" />
        <ScoreBar label="Engagement" score={scoring.engagement_score} weight="15%" />
      </div>
    </div>
  );
};
