import { cn } from "@/lib/utils";
import { OFFER_STATUS_LABELS } from "@/constants";
import type { TOfferStatus } from "@/types";

const STATUS_STYLES: Record<TOfferStatus, string> = {
  not_underwritten:
    "bg-muted text-muted-foreground border-border",
  underwritten:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  offer_sent:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  mandate_active:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
};

type StatusBadgeProps = {
  status: TOfferStatus;
  className?: string;
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      STATUS_STYLES[status],
      className
    )}
  >
    {OFFER_STATUS_LABELS[status]}
  </span>
);
