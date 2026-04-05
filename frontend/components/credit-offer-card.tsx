import { cn } from "@/lib/utils";
import { format_inr } from "@/lib/format";
import type { TCreditOffer } from "@/types";

type CreditOfferCardProps = {
  offer: TCreditOffer;
  className?: string;
};

export const CreditOfferCard = ({ offer, className }: CreditOfferCardProps) => (
  <div
    className={cn(
      "rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-emerald-800 dark:from-emerald-950/40 dark:to-card",
      className
    )}
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xl">💳</span>
      <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm uppercase tracking-wide">
        GrabCredit Offer
      </p>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Credit Limit</p>
        <p className="text-2xl font-bold text-foreground">
          {format_inr(offer.credit_limit_inr)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
        <p className="text-2xl font-bold text-foreground">
          {offer.interest_rate_percent}%
          <span className="text-sm font-normal text-muted-foreground"> p.a.</span>
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Tenure Options</p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {offer.tenure_options_months.map((t) => (
            <span
              key={t}
              className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-xs font-semibold dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800"
            >
              {t}mo
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
);
