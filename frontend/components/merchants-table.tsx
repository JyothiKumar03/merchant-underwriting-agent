"use client";

import Link from "next/link";
import { useMerchants } from "@/hooks/custom/use-merchants";
import { StatusBadge } from "@/components/status-badge";
import { TierBadge } from "@/components/tier-badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, CATEGORY_EMOJI } from "@/constants";
import { format_inr, avg_non_zero } from "@/lib/format";
import { cn } from "@/lib/utils";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
);

export const MerchantsTable = () => {
  const { data: merchants, isLoading, isError } = useMerchants();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-lg font-semibold text-foreground">Failed to load merchants</p>
        <p className="text-sm text-muted-foreground mt-1">
          Make sure the backend is running on port 3001
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Merchant
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Category
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Avg GMV / mo
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tenure
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Status
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Tier
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Credit Limit
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Coverage
              </th>
              <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : merchants?.map((merchant) => {
                  const avg_gmv = avg_non_zero(merchant.monthly_gmv_12m);
                  const result = merchant.result;

                  return (
                    <tr
                      key={merchant.merchant_id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* Merchant */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {merchant.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {merchant.merchant_id}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-1 text-xs font-medium">
                          <span>{CATEGORY_EMOJI[merchant.category]}</span>
                          {CATEGORY_LABELS[merchant.category]}
                        </span>
                      </td>

                      {/* Avg GMV */}
                      <td className="px-5 py-4 text-right font-medium tabular-nums">
                        {format_inr(avg_gmv)}
                      </td>

                      {/* Tenure */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-muted-foreground">
                          {merchant.months_on_platform}
                          <span className="text-xs"> mo</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <StatusBadge
                          status={result?.offer_status ?? "not_underwritten"}
                        />
                      </td>

                      {/* Tier */}
                      <td className="px-5 py-4 text-center">
                        {result ? (
                          <TierBadge tier={result.risk_tier} />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Credit Limit */}
                      <td className="px-5 py-4 text-right tabular-nums text-sm">
                        {result?.credit_offer ? (
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            {format_inr(result.credit_offer.credit_limit_inr)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Coverage */}
                      <td className="px-5 py-4 text-right tabular-nums text-sm">
                        {result?.insurance_offer ? (
                          <span className="font-medium text-blue-700 dark:text-blue-400">
                            {format_inr(result.insurance_offer.coverage_amount_inr)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <Link href={`/merchant/${merchant.merchant_id}`}>
                          <Button size="sm" variant={result ? "outline" : "default"}>
                            {result ? "View" : "Underwrite"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
