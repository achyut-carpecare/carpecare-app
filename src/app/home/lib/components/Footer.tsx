"use client";

import Link from "next/link";
import { ArrowUp, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background py-10">
      <div className="layout-wide px-4">
        <div className="layout-center flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-lg font-bold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Carpe Care
            </span>
            <Link
              href="/help"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="size-4" />
              Contact us
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy Policy
            </a>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <ArrowUp className="size-3.5" />
              Back to Top
            </button>
          </div>

          <p className="text-xs text-muted-foreground/70">
            Copyright &copy; 2026 Carpe Care &mdash; All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
