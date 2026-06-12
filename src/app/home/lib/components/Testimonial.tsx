import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

export function Testimonial() {
  return (
    <section className="w-full bg-background py-20 md:py-28">
      <div className="layout-content px-4">
        <div className="layout-center">
          <Card className="relative p-8 md:p-12">
            <Quote className="absolute left-6 top-6 size-10 text-primary/20 md:left-8 md:top-8 md:size-12" />

            <blockquote className="relative z-10 pt-8">
              <p
                className="text-xl leading-relaxed text-foreground md:text-2xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                In 95% of our meetings with epilepsy consultants, they request
                video footage{" "}
                <span className="text-primary">
                  [Carpe Care offers] a definite benefit for prompt and
                  effective care and treatment
                </span>
                .
              </p>
            </blockquote>

            <div className="mt-8 flex items-center gap-3 border-t border-border/30 pt-6">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-bold text-primary">HN</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Hazel</p>
                <p className="text-xs text-muted-foreground">
                  Learning Disability Nurse
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
