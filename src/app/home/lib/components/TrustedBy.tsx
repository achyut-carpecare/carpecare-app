import {
  Award,
  GraduationCap,
  HeartPulse,
  Landmark,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const partners = [
  {
    name: "Care Innovation Challenge",
    detail: "Semi-finalist",
    icon: Trophy,
  },
  {
    name: "CIC",
    detail: "Semi-finalist",
    icon: Award,
  },
  {
    name: "HCBA",
    detail: "Shortlisted",
    icon: HeartPulse,
  },
  {
    name: "CHIL",
    detail: "Partner",
    icon: Users,
  },
  {
    name: "University of Liverpool",
    detail: "Research Partner",
    icon: GraduationCap,
  },
  {
    name: "National Care Forum",
    detail: "Member",
    icon: Landmark,
  },
];

export function TrustedBy() {
  return (
    <section className="w-full border-y border-border/40 bg-muted/30 py-16 md:py-20">
      <div className="layout-content px-4">
        <div className="layout-center">
          <p className="mb-10 text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Trusted by
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {partners.map((partner) => {
              const Icon = partner.icon;
              return (
                <div
                  key={partner.name}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-background p-4 text-center transition-colors hover:border-border"
                >
                  <Icon className="size-6 text-primary" />
                  <div className="text-xs font-semibold leading-tight text-foreground">
                    {partner.name}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {partner.detail}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
