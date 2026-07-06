"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleSystemAdminAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface AdminStatusSwitchProps {
  userId: string;
  isAdmin: boolean;
  disabled?: boolean;
}

export function AdminStatusSwitch({
  userId,
  isAdmin,
  disabled,
}: AdminStatusSwitchProps) {
  const [checked, setChecked] = useState(isAdmin);
  const [isPending, setIsPending] = useState(false);

  async function handleToggle(nextChecked: boolean) {
    // Optimistic update
    setChecked(nextChecked);
    setIsPending(true);

    const result = await toggleSystemAdminAction({
      userId,
      isSystemAdmin: nextChecked,
    });

    setIsPending(false);

    if (result.error) {
      // Revert on error
      setChecked(!nextChecked);
      toast.error(result.error);
      return;
    }

    toast.success(
      nextChecked ? "User is now a system admin" : "Admin access removed",
    );
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleToggle}
      disabled={disabled || isPending}
      aria-label="System administrator"
    />
  );
}
