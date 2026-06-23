"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CareHome {
  id: string;
  name: string | null;
}

interface CareHomeSwitcherProps {
  careHomes: CareHome[];
  currentCareHomeId: string;
}

export function CareHomeSwitcher({
  careHomes,
  currentCareHomeId,
}: CareHomeSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(careHomeId: string) {
    if (careHomeId === currentCareHomeId) return;

    // Preserve the path structure but swap the care home id.
    const newPath = pathname.replace(
      /\/app\/care-homes\/[^\/]+/,
      `/app/care-homes/${careHomeId}`,
    );

    router.push(newPath);
  }

  return (
    <Select value={currentCareHomeId} onValueChange={handleChange}>
      <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 text-xs">
        <SelectValue placeholder="Select care home" />
      </SelectTrigger>
      <SelectContent>
        {careHomes.map((home) => (
          <SelectItem key={home.id} value={home.id}>
            {home.name ?? "Unnamed care home"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
