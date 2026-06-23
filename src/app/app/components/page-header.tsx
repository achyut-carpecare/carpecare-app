import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "secondary" | "ghost" | "outline" | "destructive";
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: PageHeaderAction[];
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-3", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <div className="flex flex-col flex-wrap gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {actions.map((action, index) => {
              const variant = action.variant ?? "default";
              const button = (
                <Button
                  key={index}
                  variant={
                    variant === "secondary"
                      ? "outline"
                      : variant === "destructive"
                        ? "destructive"
                        : variant === "default"
                          ? "default"
                          : "ghost"
                  }
                  onClick={action.onClick}
                  asChild={!!action.href}
                >
                  {action.href ? (
                    <Link href={action.href}>
                      {action.icon && (
                        <span className="mr-1.5">{action.icon}</span>
                      )}
                      {action.label}
                    </Link>
                  ) : (
                    <>
                      {action.icon && (
                        <span className="mr-1.5">{action.icon}</span>
                      )}
                      {action.label}
                    </>
                  )}
                </Button>
              );
              return button;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
