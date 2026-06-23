import { cn } from "@/lib/utils";

interface DaysSinceRingProps {
  days: number | null;
  className?: string;
}

export function DaysSinceRing({ days, className }: DaysSinceRingProps) {
  const isToday = days === 0;
  const isWatch = days !== null && days > 0 && days <= 3;
  const isStable = days === null || days > 3;

  const color = isToday ? "#ef4444" : isWatch ? "#f59e0b" : "#22c55e";

  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(${color} 0% 75%, hsl(var(--border)) 75% 100%)`,
  };

  return (
    <div className={cn("text-center", className)}>
      <div className="relative w-32 h-32 mx-auto mb-3">
        <div
          className="absolute inset-0 rounded-full p-2"
          style={{
            ...ringStyle,
            maskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMaskComposite: "xor",
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold">
            {days === null ? "—" : days}
          </span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            days since
          </span>
        </div>
      </div>
      <p className="font-semibold">
        {isToday
          ? "Last event today"
          : days === null
            ? "No events recorded"
            : days === 1
              ? "1 day since last event"
              : `${days} days since last event`}
      </p>
    </div>
  );
}
