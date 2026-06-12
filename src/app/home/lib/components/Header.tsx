import Link from "next/link";
import { Mail } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="layout-wide px-4">
        <div className="layout-center flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Carpe Care
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <a
              href="mailto:contact@carpecare.co.uk"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              <Mail className="size-4" />
              <span>contact@carpecare.co.uk</span>
            </a>
            <a
              href="#updates"
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Get Updates
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
