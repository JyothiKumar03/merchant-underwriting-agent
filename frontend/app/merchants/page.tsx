"use client";

import { useState, useRef } from "react";
import { useCreateMerchant } from "@/hooks/custom/use-create-merchant";
import { useBulkUpload } from "@/hooks/custom/use-bulk-upload";
import { MerchantForm } from "@/components/merchant-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FOOTER_TEXT } from "@/constants";
import type { TMerchantInput, TBulkUploadResponse } from "@/types";

const CSV_TEMPLATE_HEADERS = [
  "name", "category", "contact_whatsapp", "months_on_platform", "total_deals_listed",
  "gmv_m1", "gmv_m2", "gmv_m3", "gmv_m4", "gmv_m5", "gmv_m6",
  "gmv_m7", "gmv_m8", "gmv_m9", "gmv_m10", "gmv_m11", "gmv_m12",
  "coupon_redemption_rate", "unique_customer_count", "customer_return_rate",
  "avg_order_value", "seasonality_index", "deal_exclusivity_rate", "return_and_refund_rate",
].join(",");

export default function MerchantsPage() {
  const [bulk_open, set_bulk_open] = useState(false);
  const [bulk_result, set_bulk_result] = useState<TBulkUploadResponse | null>(null);
  const [success_msg, set_success_msg] = useState<string | null>(null);
  const file_ref = useRef<HTMLInputElement>(null);

  const create_mut = useCreateMerchant();
  const bulk_mut = useBulkUpload();

  const on_add = (data: TMerchantInput) => {
    set_success_msg(null);
    create_mut.mutate(data, {
      onSuccess: (res) => {
        set_success_msg(`${res.merchant.name} added successfully (ID: ${res.merchant.merchant_id})`);
        create_mut.reset();
      },
    });
  };

  const on_bulk_close = () => {
    set_bulk_open(false);
    set_bulk_result(null);
    bulk_mut.reset();
  };

  const on_file_change = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    bulk_mut.mutate(text, {
      onSuccess: (result) => set_bulk_result(result),
    });
    if (file_ref.current) file_ref.current.value = "";
  };

  const download_template = () => {
    const blob = new Blob([CSV_TEMPLATE_HEADERS + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merchant_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Add Merchant</h1>
            <p className="text-muted-foreground mt-1.5">
              Enter the full merchant profile. All fields are required.
            </p>
          </div>
          <Button variant="outline" onClick={() => set_bulk_open(true)} className="shrink-0 mt-1">
            Bulk Upload CSV
          </Button>
        </div>

        {/* Error */}
        {create_mut.isError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
            ⚠️ {create_mut.error?.message ?? "Failed to add merchant"}
          </div>
        )}

        {/* Inline form */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <MerchantForm
            onSubmit={on_add}
            isSubmitting={create_mut.isPending}
            successMessage={success_msg ?? undefined}
          />
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {FOOTER_TEXT}
      </footer>

      {/* Bulk Upload Modal */}
      <Dialog open={bulk_open} onOpenChange={(open) => { if (!open) on_bulk_close(); else set_bulk_open(true); }}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload via CSV</DialogTitle>
            <DialogDescription>
              One merchant per row. Every row is Zod-validated before inserting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template info */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">24 required columns</p>
                <Button variant="outline" size="sm" onClick={download_template}>
                  Download Template
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {[
                  "name", "category", "contact_whatsapp",
                  "months_on_platform", "total_deals_listed",
                  "gmv_m1 … gmv_m12",
                  "coupon_redemption_rate", "unique_customer_count",
                  "customer_return_rate", "avg_order_value",
                  "seasonality_index", "deal_exclusivity_rate",
                  "return_and_refund_rate",
                ].map((col) => (
                  <p key={col} className="text-xs text-muted-foreground truncate">
                    · {col}
                  </p>
                ))}
              </div>
            </div>

            {/* Results */}
            {bulk_result ? (
              <div className="space-y-3">
                {bulk_result.inserted_count > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ {bulk_result.inserted_count} merchant{bulk_result.inserted_count !== 1 ? "s" : ""} added
                    </p>
                    {bulk_result.inserted.length > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {bulk_result.inserted.map((m) => m.name).join(", ")}
                      </p>
                    )}
                  </div>
                )}
                {bulk_result.failed_count > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950/30">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                      ⚠️ {bulk_result.failed_count} row{bulk_result.failed_count !== 1 ? "s" : ""} failed
                    </p>
                    <ul className="text-xs text-red-600 dark:text-red-400 mt-1 space-y-0.5">
                      {[...bulk_result.validation_errors, ...bulk_result.insert_errors].map((e, i) => (
                        <li key={i}>Row {e.row}: {e.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button className="w-full" onClick={on_bulk_close}>Done</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {bulk_mut.isError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
                    ⚠️ {bulk_mut.error?.message ?? "Upload failed"}
                  </div>
                )}
                <input
                  ref={file_ref}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={on_file_change}
                  className="hidden"
                />
                <Button
                  className="w-full"
                  onClick={() => file_ref.current?.click()}
                  disabled={bulk_mut.isPending}
                >
                  {bulk_mut.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
                      Uploading…
                    </span>
                  ) : (
                    "Choose CSV File"
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
