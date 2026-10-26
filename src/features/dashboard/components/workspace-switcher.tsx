"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type WorkspaceType = "establishment" | "family" | "organisation";

interface WorkspaceItem {
  id: string;
  name: string | null;
}

export interface WorkspaceGroup {
  type: WorkspaceType;
  label: string;
  items: WorkspaceItem[];
}

interface WorkspaceSwitcherProps {
  groups: WorkspaceGroup[];
  activeType: WorkspaceType;
  activeItemId?: string;
}

const TYPE_HREF_PREFIX: Record<WorkspaceType, string> = {
  establishment: "/app/care-homes",
  family: "/app/care-homes",
  organisation: "/app/organisations",
};

export function WorkspaceSwitcher({
  groups,
  activeType,
  activeItemId,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const activeGroup = groups.find((g) => g.type === activeType) ?? groups[0];

  if (!activeGroup) {
    return (
      <div className="text-xs text-muted-foreground px-1">
        Not a member of any establishment
      </div>
    );
  }

  function navigateToItem(
    type: WorkspaceType,
    itemId: string,
    preserveSubpath: boolean,
  ) {
    const prefix = TYPE_HREF_PREFIX[type];

    if (
      preserveSubpath &&
      (pathname.startsWith("/app/care-homes/") ||
        pathname.startsWith("/app/organisations/"))
    ) {
      const newPath = pathname.replace(
        /\/app\/(care-homes|organisations)\/[^/]+/,
        `${prefix}/${itemId}`,
      );
      router.push(newPath);
      return;
    }

    router.push(`${prefix}/${itemId}`);
  }

  function handleTypeChange(type: WorkspaceType) {
    if (type === activeType) return;
    const group = groups.find((g) => g.type === type);
    const firstItem = group?.items[0];
    if (!firstItem) return;
    navigateToItem(type, firstItem.id, false);
  }

  function handleItemChange(itemId: string) {
    if (itemId === activeItemId) return;
    navigateToItem(activeType, itemId, true);
  }

  return (
    <div className="space-y-2">
      {groups.length > 1 && (
        <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
          {groups.map((group) => (
            <button
              key={group.type}
              type="button"
              onClick={() => handleTypeChange(group.type)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                group.type === activeType
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}

      <Select value={activeItemId ?? ""} onValueChange={handleItemChange}>
        <SelectTrigger className="w-full rounded-xl border-border bg-muted/50 text-xs">
          <SelectValue
            placeholder={`Select ${activeGroup.label.toLowerCase()}`}
          />
        </SelectTrigger>
        <SelectContent>
          {activeGroup.items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name ?? "Unnamed"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
