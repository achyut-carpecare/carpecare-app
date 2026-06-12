import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

export function Hero() {
  return (
    <section className="layout-content px-4 py-24 md:py-32 lg:py-40">
      <div className="layout-center flex flex-col items-center text-center">
        <h1
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Connecting care with{" "}
          <span className="text-primary">clinical insight</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Carer-worn video to capture neurological events, share securely with
          clinicians, and facilitate safety and diagnosis.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="rounded-full px-8 text-base">
            <a href="#updates" className="flex items-center gap-2">
              Get Updates
              <ArrowDown className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
