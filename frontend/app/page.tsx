"use client";

import { MerchantsTable } from "@/components/merchants-table";
import { FOOTER_TEXT } from "@/constants";
import { useMerchants } from "@/hooks/custom/use-merchants";

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className="text-3xl font-bold text-foreground">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

export default function HomePage() {
  const { data: merchants } = useMerchants();

  const total = merchants?.length ?? 0;
  const underwritten =
    merchants?.filter((m) => m.result && m.result.offer_status !== "not_underwritten")
      .length ?? 0;
  const mandate_active =
    merchants?.filter((m) => m.result?.offer_status === "mandate_active").length ?? 0;
  const rejected =
    merchants?.filter((m) => m.result?.risk_tier === "rejected").length ?? 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              G
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight">
                GrabCredit × GrabInsurance
              </p>
              <p className="text-xs text-muted-foreground">
                Merchant Underwriting Agent
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Powered
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
        {/* Hero */}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Merchant Dashboard
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Score merchants, generate AI-powered credit & insurance offers, and deliver via WhatsApp.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Merchants" value={total} sub="in this cohort" />
          <StatCard
            label="Underwritten"
            value={underwritten}
            sub={`${total > 0 ? Math.round((underwritten / total) * 100) : 0}% coverage`}
          />
          <StatCard
            label="Mandate Active"
            value={mandate_active}
            sub="accepted offers"
          />
          <StatCard label="Rejected" value={rejected} sub="ineligible merchants" />
        </div>

        {/* Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              All Merchants
            </h2>
            <p className="text-sm text-muted-foreground">
              Click a merchant to underwrite and view details
            </p>
          </div>
          <MerchantsTable />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {FOOTER_TEXT}
      </footer>
    </div>
  );
}
