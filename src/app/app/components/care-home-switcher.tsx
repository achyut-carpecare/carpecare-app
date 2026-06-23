"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CareHome = {
  id: string;
  name: string | null;
};

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

    // Preserve the page path but switch the care home segment.
    const newPath = pathname?.replace(
      /\/app\/care-homes\/[^\/]+/,
      `/app/care-homes/${careHomeId}`,
    );

    if (newPath && newPath !== pathname) {
      router.push(newPath);
    } else {
      router.push(`/app/care-homes/${careHomeId}`);
    }
  }

  return (
    <div className="px-3 py-2">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Care home
      </label>
      <Select value={currentCareHomeId} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
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
    </div>
  );
}
