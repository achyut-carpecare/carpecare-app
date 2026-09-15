"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetUserMfaAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface ResetMfaButtonProps {
  userId: string;
}

export function ResetMfaButton({ userId }: ResetMfaButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    startTransition(async () => {
      const result = await resetUserMfaAction(userId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        "MFA reset - this user will be asked to set up a new authenticator next time they sign in",
      );
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      aria-label="Reset MFA"
      title="Reset MFA"
      onClick={handleClick}
    >
      <ShieldOff className="w-4 h-4" />
    </Button>
  );
}
