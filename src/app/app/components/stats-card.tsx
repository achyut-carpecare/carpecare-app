import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: string | number;
  label: string;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatsCard({
  value,
  label,
  className,
  variant = "default",
}: StatsCardProps) {
  const valueClasses = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  return (
    <Card className={cn("border", className)}>
      <CardContent className="p-5">
        <div
          className={cn(
            "text-3xl font-extrabold tracking-tight",
            valueClasses[variant],
          )}
        >
          {value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
