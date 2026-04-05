import { cn } from "@/lib/utils";
import { format_inr } from "@/lib/format";
import type { TInsuranceOffer } from "@/types";

type InsuranceOfferCardProps = {
  offer: TInsuranceOffer;
  className?: string;
};

export const InsuranceOfferCard = ({ offer, className }: InsuranceOfferCardProps) => (
  <div
    className={cn(
      "rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 dark:border-blue-800 dark:from-blue-950/40 dark:to-card",
      className
    )}
  >
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xl">🛡️</span>
      <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm uppercase tracking-wide">
        GrabInsurance Offer
      </p>
    </div>

    <div className="mb-3">
      <p className="text-xs text-muted-foreground mb-1">Policy Type</p>
      <p className="text-sm font-semibold text-foreground">{offer.policy_type}</p>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Coverage</p>
        <p className="text-2xl font-bold text-foreground">
          {format_inr(offer.coverage_amount_inr)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Annual Premium</p>
        <p className="text-2xl font-bold text-foreground">
          {format_inr(offer.annual_premium_inr)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">Quarterly Premium</p>
        <p className="text-2xl font-bold text-foreground">
          {format_inr(offer.quarterly_premium_inr)}
        </p>
      </div>
    </div>
  </div>
);
