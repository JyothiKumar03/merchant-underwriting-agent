type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  size?: "default" | "sm";
};

export const StatCard = ({ label, value, sub, size = "default" }: StatCardProps) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
      {label}
    </p>
    <p className={size === "sm" ? "text-2xl font-bold text-foreground" : "text-3xl font-bold text-foreground"}>
      {value}
    </p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);
