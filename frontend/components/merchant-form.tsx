"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY, CATEGORY_LABELS, CATEGORY_EMOJI } from "@/constants";
import { cn } from "@/lib/utils";
import type { TMerchantInput } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Required"),
  category: z.enum(CATEGORY),
  contact_whatsapp: z.string().min(10, "Min 10 chars").max(20),
  months_on_platform: z.coerce.number().int().min(0),
  total_deals_listed: z.coerce.number().int().min(0),
  monthly_gmv_12m: z.tuple([
    z.coerce.number().min(0), z.coerce.number().min(0), z.coerce.number().min(0),
    z.coerce.number().min(0), z.coerce.number().min(0), z.coerce.number().min(0),
    z.coerce.number().min(0), z.coerce.number().min(0), z.coerce.number().min(0),
    z.coerce.number().min(0), z.coerce.number().min(0), z.coerce.number().min(0),
  ]),
  coupon_redemption_rate: z.coerce.number().min(0).max(1),
  unique_customer_count: z.coerce.number().int().min(0),
  customer_return_rate: z.coerce.number().min(0).max(1),
  avg_order_value: z.coerce.number().min(0),
  seasonality_index: z.coerce.number().min(1),
  deal_exclusivity_rate: z.coerce.number().min(0).max(1),
  return_and_refund_rate: z.coerce.number().min(0).max(1),
});

type FormValues = z.infer<typeof schema>;

type MerchantFormProps = {
  onSubmit: (data: TMerchantInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  successMessage?: string;
};

const FieldLabel = ({ children, error }: { children: React.ReactNode; error?: string }) => (
  <div className="space-y-1">
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
    {children}
  </p>
);

const MONTH_LABELS = [
  "Jan (M1)", "Feb (M2)", "Mar (M3)", "Apr (M4)",
  "May (M5)", "Jun (M6)", "Jul (M7)", "Aug (M8)",
  "Sep (M9)", "Oct (M10)", "Nov (M11)", "Dec (M12)",
];

export const MerchantForm = ({ onSubmit, onCancel, isSubmitting, successMessage }: MerchantFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      monthly_gmv_12m: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      months_on_platform: 0,
      total_deals_listed: 0,
      coupon_redemption_rate: 0,
      unique_customer_count: 0,
      customer_return_rate: 0,
      avg_order_value: 0,
      seasonality_index: 1,
      deal_exclusivity_rate: 0,
      return_and_refund_rate: 0,
    },
  });

  const on_valid = (values: FormValues) => {
    onSubmit({
      ...values,
      monthly_gmv_12m: Array.from(values.monthly_gmv_12m),
    } as TMerchantInput);
  };

  return (
    <form onSubmit={handleSubmit(on_valid)} className="space-y-5">
      {/* Basic Info */}
      <SectionTitle>Basic Info</SectionTitle>

      <FieldLabel error={errors.name?.message}>
        <label className="text-sm font-medium">Business Name</label>
        <Input {...register("name")} placeholder="e.g. StyleKraft Fashion" />
      </FieldLabel>

      <FieldLabel error={errors.category?.message}>
        <label className="text-sm font-medium">Category</label>
        <select
          {...register("category")}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        >
          <option value="">Select category</option>
          {CATEGORY.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </FieldLabel>

      <FieldLabel error={errors.contact_whatsapp?.message}>
        <label className="text-sm font-medium">WhatsApp Number</label>
        <Input {...register("contact_whatsapp")} placeholder="+918880300300" />
      </FieldLabel>

      {/* Platform */}
      <SectionTitle>Platform Data</SectionTitle>

      <div className="grid grid-cols-2 gap-3">
        <FieldLabel error={errors.months_on_platform?.message}>
          <label className="text-sm font-medium">Months on Platform</label>
          <Input {...register("months_on_platform")} type="number" min={0} />
        </FieldLabel>
        <FieldLabel error={errors.total_deals_listed?.message}>
          <label className="text-sm font-medium">Deals Listed</label>
          <Input {...register("total_deals_listed")} type="number" min={0} />
        </FieldLabel>
      </div>

      {/* Monthly GMV */}
      <SectionTitle>Monthly GMV — Last 12 Months (₹)</SectionTitle>
      <p className="text-xs text-muted-foreground -mt-3">Enter 0 for months with no activity.</p>

      <div className="grid grid-cols-3 gap-2">
        {MONTH_LABELS.map((label, i) => (
          <FieldLabel key={i} error={(errors.monthly_gmv_12m as Record<number, { message?: string }>)?.[i]?.message}>
            <label className="text-xs text-muted-foreground">{label}</label>
            <Input
              {...register(`monthly_gmv_12m.${i}` as `monthly_gmv_12m.${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`)}
              type="number"
              min={0}
              placeholder="0"
            />
          </FieldLabel>
        ))}
      </div>

      {/* Performance */}
      <SectionTitle>Performance Metrics</SectionTitle>
      <p className="text-xs text-muted-foreground -mt-3">Rate fields: enter as decimal 0–1 (e.g. 0.75 = 75%).</p>

      <div className="grid grid-cols-2 gap-3">
        <FieldLabel error={errors.coupon_redemption_rate?.message}>
          <label className="text-sm font-medium">Coupon Redemption Rate</label>
          <Input {...register("coupon_redemption_rate")} type="number" step="0.001" min={0} max={1} placeholder="0.68" />
        </FieldLabel>
        <FieldLabel error={errors.unique_customer_count?.message}>
          <label className="text-sm font-medium">Unique Customers</label>
          <Input {...register("unique_customer_count")} type="number" min={0} />
        </FieldLabel>
        <FieldLabel error={errors.customer_return_rate?.message}>
          <label className="text-sm font-medium">Customer Return Rate</label>
          <Input {...register("customer_return_rate")} type="number" step="0.001" min={0} max={1} placeholder="0.53" />
        </FieldLabel>
        <FieldLabel error={errors.avg_order_value?.message}>
          <label className="text-sm font-medium">Avg Order Value (₹)</label>
          <Input {...register("avg_order_value")} type="number" min={0} placeholder="1500" />
        </FieldLabel>
        <FieldLabel error={errors.seasonality_index?.message}>
          <label className="text-sm font-medium">Seasonality Index</label>
          <Input {...register("seasonality_index")} type="number" step="0.01" min={1} placeholder="1.38" />
        </FieldLabel>
        <FieldLabel error={errors.deal_exclusivity_rate?.message}>
          <label className="text-sm font-medium">Deal Exclusivity Rate</label>
          <Input {...register("deal_exclusivity_rate")} type="number" step="0.001" min={0} max={1} placeholder="0.45" />
        </FieldLabel>
        <FieldLabel error={errors.return_and_refund_rate?.message}>
          <label className="text-sm font-medium">Return & Refund Rate</label>
          <Input {...register("return_and_refund_rate")} type="number" step="0.001" min={0} max={1} placeholder="0.021" />
        </FieldLabel>
      </div>

      {/* Success */}
      {successMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
          ✓ {successMessage}
        </div>
      )}

      {/* Actions */}
      <div className={cn("flex gap-3 pt-2", onCancel ? "" : "justify-end")}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className={onCancel ? "flex-1" : "min-w-[160px]"}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
              Adding…
            </span>
          ) : (
            "Add Merchant →"
          )}
        </Button>
      </div>
    </form>
  );
};
