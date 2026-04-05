import { cn } from "@/lib/utils";

const get_color = (score: number): string => {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-blue-500";
  if (score >= 30) return "bg-amber-500";
  return "bg-red-500";
};

type ScoreBarProps = {
  label: string;
  score: number;
  weight?: string;
  className?: string;
};

export const ScoreBar = ({ label, score, weight, className }: ScoreBarProps) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/80 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        {weight && (
          <span className="text-muted-foreground text-xs">{weight}</span>
        )}
        <span className="font-semibold tabular-nums">{score.toFixed(1)}</span>
      </div>
    </div>
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", get_color(score))}
        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
      />
    </div>
  </div>
);
