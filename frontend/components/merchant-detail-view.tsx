"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMerchant } from "@/hooks/custom/use-merchant";
import { useUnderwrite } from "@/hooks/custom/use-underwrite";
import { useSendOffer } from "@/hooks/custom/use-send-offer";
import { useAcceptOffer } from "@/hooks/custom/use-accept-offer";
import { ModeToggle } from "@/components/mode-toggle";
import { ScoringBreakdown } from "@/components/scoring-breakdown";
import { CreditOfferCard } from "@/components/credit-offer-card";
import { InsuranceOfferCard } from "@/components/insurance-offer-card";
import { RationalePanel } from "@/components/rationale-panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, CATEGORY_EMOJI, FOOTER_TEXT } from "@/constants";
import { format_inr, format_percent, avg_non_zero } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/stat-card";
import type { TUnderWritingMode, TUnderwritingResult } from "@/types";

type MerchantDetailViewProps = {
  merchant_id: string;
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="w-10 h-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
    <p className="text-sm text-muted-foreground font-medium">
      Running AI underwriting engine…
    </p>
    <p className="text-xs text-muted-foreground/60">
      Scoring · Offer calculation · Claude rationale
    </p>
  </div>
);

const has_rationale = (
  result: TUnderwritingResult | null | undefined,
  mode: TUnderWritingMode
): boolean => {
  if (!result) return false;
  return mode === "credit"
    ? result.credit_rationale.length > 0
    : result.insurance_rationale.length > 0;
};

export const MerchantDetailView = ({ merchant_id }: MerchantDetailViewProps) => {
  const [mode, set_mode] = useState<TUnderWritingMode>("credit");

  const { data: merchant, isLoading: merchant_loading } = useMerchant(merchant_id);
  const underwrite_mut = useUnderwrite(merchant_id);
  const send_offer_mut = useSendOffer(merchant_id);
  const accept_offer_mut = useAcceptOffer(merchant_id);

  // Track the latest result — prefer freshly mutated data if available
  const result = underwrite_mut.data ?? merchant?.result ?? null;

  // Auto-switch to missing rationale after underwrite if both modes need it
  useEffect(() => {
    if (underwrite_mut.isSuccess && !has_rationale(result, mode)) {
      // Result exists but the other mode is missing rationale — that's expected, not an error
    }
  }, [underwrite_mut.isSuccess, result, mode]);

  const on_underwrite = () => {
    underwrite_mut.mutate(mode);
  };

  const on_send_whatsapp = () => {
    send_offer_mut.mutate({ merchantId: merchant_id, mode });
  };

  const on_confirm = () => {
    accept_offer_mut.mutate();
  };

  const is_underwriting = underwrite_mut.isPending;
  const is_sending = send_offer_mut.isPending;
  const is_accepting = accept_offer_mut.isPending;

  const can_underwrite =
    !is_underwriting && (!has_rationale(result, mode) || !result);

  const offer_status = result?.offer_status ?? "not_underwritten";
  const can_send = result && offer_status === "underwritten";
  const can_accept =
    result &&
    (offer_status === "underwritten" || offer_status === "offer_sent") &&
    result.risk_tier !== "rejected";
  const is_mandate_active = offer_status === "mandate_active";

  if (merchant_loading) {
    return (
      <div className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-muted" />
          <div className="h-40 rounded-2xl bg-muted" />
          <div className="h-64 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
        <span className="text-4xl mb-4">🔍</span>
        <p className="text-lg font-semibold">Merchant not found</p>
        <p className="text-sm text-muted-foreground mt-1">ID: {merchant_id}</p>
        <Link href="/" className="mt-6">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const avg_gmv = avg_non_zero(merchant.monthly_gmv_12m);
  const active_rationale =
    mode === "credit" ? result?.credit_rationale : result?.insurance_rationale;
  const active_user_message =
    mode === "credit" ? result?.credit_user_message : result?.insurance_user_message;
  const active_offer =
    mode === "credit" ? result?.credit_offer : result?.insurance_offer;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-8 space-y-8">
        {/* Back + title */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {merchant.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-xs font-medium">
                  {CATEGORY_EMOJI[merchant.category]}
                  {CATEGORY_LABELS[merchant.category]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {merchant.merchant_id}
                </span>
                <StatusBadge status={offer_status} />
              </div>
            </div>
            {is_mandate_active && result?.nach_umrn && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">
                  NACH Mandate
                </p>
                <p className="font-mono text-xs text-emerald-800 dark:text-emerald-300">
                  {result.nach_umrn}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Merchant metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Avg Monthly GMV"
            value={format_inr(avg_gmv)}
            sub="non-zero months"
          />
          <StatCard
            label="Customer Return Rate"
            value={format_percent(merchant.customer_return_rate)}
            sub={`${merchant.unique_customer_count.toLocaleString()} unique customers`}
          />
          <StatCard
            label="Return & Refund Rate"
            value={format_percent(merchant.return_and_refund_rate)}
            sub="lower is better"
          />
          <StatCard
            label="Platform Tenure"
            value={`${merchant.months_on_platform} mo`}
            sub={`${merchant.total_deals_listed} deals listed`}
          />
        </div>

        {/* Secondary metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Avg Order Value"
            value={format_inr(merchant.avg_order_value)}
          />
          <StatCard
            label="Coupon Redemption"
            value={format_percent(merchant.coupon_redemption_rate)}
          />
          <StatCard
            label="Deal Exclusivity"
            value={format_percent(merchant.deal_exclusivity_rate)}
            sub="GrabOn-exclusive"
          />
          <StatCard
            label="Seasonality Index"
            value={merchant.seasonality_index.toFixed(2)}
            sub="1.0 = stable"
          />
        </div>

        {/* Mode toggle + underwrite */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                Select Underwriting Mode
              </p>
              <p className="text-xs text-muted-foreground">
                {has_rationale(result, mode)
                  ? "Rationale already generated — showing cached result"
                  : result
                  ? `Rationale missing for ${mode} mode — click to generate`
                  : "Not yet underwritten — click to run the full pipeline"}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ModeToggle
                mode={mode}
                onChange={set_mode}
                disabled={is_underwriting}
              />
              <Button
                onClick={on_underwrite}
                disabled={!can_underwrite || is_underwriting}
                className={cn(
                  "min-w-[140px]",
                  !can_underwrite && "opacity-50 cursor-not-allowed"
                )}
              >
                {is_underwriting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                    Running…
                  </span>
                ) : has_rationale(result, mode) ? (
                  "Re-underwrite"
                ) : (
                  "Underwrite ✦"
                )}
              </Button>
            </div>
          </div>

          {underwrite_mut.isError && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
              ⚠️ {underwrite_mut.error?.message ?? "Underwriting failed. Please try again."}
            </div>
          )}
        </div>

        {/* Loading state */}
        {is_underwriting && (
          <div className="rounded-2xl border border-border bg-card">
            <LoadingSpinner />
          </div>
        )}

        {/* Results */}
        {result && !is_underwriting && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* Left: Scoring */}
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-3">
                Risk Assessment
              </p>
              <ScoringBreakdown scoring={result.scoring} tier={result.risk_tier} />
            </div>

            {/* Right: Offer + Rationale */}
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {mode === "credit" ? "Credit Offer" : "Insurance Offer"}
              </p>

              {/* Offer card */}
              {result.risk_tier !== "rejected" && active_offer ? (
                mode === "credit" && result.credit_offer ? (
                  <CreditOfferCard offer={result.credit_offer} />
                ) : result.insurance_offer ? (
                  <InsuranceOfferCard offer={result.insurance_offer} />
                ) : null
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-950/30">
                  <p className="font-semibold text-red-700 dark:text-red-400">
                    No Offer — Merchant Rejected
                  </p>
                  <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                    {result.scoring.pre_filter_reason ??
                      `Composite score ${result.scoring.composite_score.toFixed(1)}/100 is below the minimum threshold of 30.`}
                  </p>
                </div>
              )}

              {/* Rationale */}
              {active_rationale && active_user_message ? (
                <>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    AI Rationale
                  </p>
                  <RationalePanel
                    analyst_explanation={active_rationale}
                    user_message={active_user_message}
                    mode={mode}
                  />
                </>
              ) : (
                <div className="rounded-2xl border border-border bg-muted/30 p-5 text-center">
                  <p className="text-sm text-muted-foreground">
                    No rationale yet for {mode} mode.
                    {result && " Click Underwrite to generate."}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {has_rationale(result, mode) && !is_mandate_active && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Next Steps
                  </p>

                  {send_offer_mut.isSuccess && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                      ✓ WhatsApp message sent to merchant
                    </div>
                  )}

                  {send_offer_mut.isError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                      ⚠️ {send_offer_mut.error?.message ?? "Failed to send WhatsApp message"}
                    </div>
                  )}

                  {accept_offer_mut.isSuccess && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                      ✓ NACH mandate created:{" "}
                      <span className="font-mono">
                        {accept_offer_mut.data?.nach_umrn}
                      </span>
                    </div>
                  )}

                  {accept_offer_mut.isError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                      ⚠️ {accept_offer_mut.error?.message ?? "Failed to accept offer"}
                    </div>
                  )}

                  {result.risk_tier !== "rejected" && (
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={on_send_whatsapp}
                        disabled={is_sending || !can_send}
                        className="flex-1 min-w-[160px]"
                      >
                        {is_sending ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                            Sending…
                          </span>
                        ) : (
                          <>📱 Send via WhatsApp</>
                        )}
                      </Button>

                      <Button
                        onClick={on_confirm}
                        disabled={is_accepting || !can_accept}
                        className="flex-1 min-w-[160px]"
                      >
                        {is_accepting ? (
                          <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                            Confirming…
                          </span>
                        ) : (
                          <>✓ Confirm Here</>
                        )}
                      </Button>
                    </div>
                  )}

                  {!can_send && result.risk_tier !== "rejected" && (
                    <p className="text-xs text-muted-foreground">
                      WhatsApp can only be sent once the merchant is underwritten and not
                      yet in mandate_active state.
                    </p>
                  )}
                </div>
              )}

              {/* Mandate active state */}
              {is_mandate_active && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">✅</span>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Mandate Active
                    </p>
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    The merchant has accepted the offer and the NACH mandate is active.
                  </p>
                  {result?.nach_umrn && (
                    <p className="text-xs font-mono mt-2 text-emerald-600 dark:text-emerald-400">
                      UMRN: {result.nach_umrn}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !is_underwriting && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
            <p className="text-4xl mb-4">🤖</p>
            <p className="text-lg font-semibold text-foreground">
              Ready to underwrite
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
              Select a mode above and click <strong>Underwrite</strong> to run the full
              AI scoring pipeline.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {FOOTER_TEXT}
      </footer>
    </div>
  );
};

