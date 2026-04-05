import { cn } from "@/lib/utils";

type RationalePanelProps = {
  analyst_explanation: string;
  user_message: string;
  mode: "credit" | "insurance";
  className?: string;
};

export const RationalePanel = ({
  analyst_explanation,
  user_message,
  mode,
  className,
}: RationalePanelProps) => (
  <div className={cn("space-y-3", className)}>
    {/* WhatsApp message preview */}
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💬</span>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          WhatsApp Message Preview
        </p>
      </div>
      <div className="rounded-xl bg-[#dcf8c6] dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {user_message}
        </p>
      </div>
    </div>

    {/* Analyst rationale */}
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🔍</span>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Analyst Rationale
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] normal-case">
            Internal
          </span>
        </p>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{analyst_explanation}</p>
    </div>
  </div>
);
