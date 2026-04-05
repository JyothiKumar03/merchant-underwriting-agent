import { cn } from "@/lib/utils";
import type { TUnderWritingMode } from "@/types";

type ModeToggleProps = {
  mode: TUnderWritingMode;
  onChange: (mode: TUnderWritingMode) => void;
  disabled?: boolean;
};

export const ModeToggle = ({ mode, onChange, disabled }: ModeToggleProps) => (
  <div className="inline-flex rounded-xl border border-border bg-muted p-1 gap-1">
    {(["credit", "insurance"] as TUnderWritingMode[]).map((m) => (
      <button
        key={m}
        onClick={() => onChange(m)}
        disabled={disabled}
        className={cn(
          "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          mode === m
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {m === "credit" ? "GrabCredit" : "GrabInsurance"}
      </button>
    ))}
  </div>
);
