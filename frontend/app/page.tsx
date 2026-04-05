"use client";

import { MerchantsTable } from "@/components/merchants-table";
import { StatCard } from "@/components/stat-card";
import { FOOTER_TEXT } from "@/constants";
import { useMerchants } from "@/hooks/custom/use-merchants";

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
          <StatCard label="Mandate Active" value={mandate_active} sub="accepted offers" />
          <StatCard label="Rejected" value={rejected} sub="ineligible merchants" />
        </div>

        {/* Table */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">All Merchants</h2>
            <p className="text-sm text-muted-foreground">
              Click a merchant to underwrite and view details
            </p>
          </div>
          <MerchantsTable />
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {FOOTER_TEXT}
      </footer>
    </div>
  );
}
