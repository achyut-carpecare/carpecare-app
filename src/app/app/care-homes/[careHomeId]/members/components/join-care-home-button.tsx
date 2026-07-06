"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinCareHomeAction } from "@/app/app/admin/users/lib/actions";
import { toast } from "@/components/ui/sonner";

interface JoinCareHomeButtonProps {
  careHomeId: string;
}

export function JoinCareHomeButton({ careHomeId }: JoinCareHomeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    startTransition(async () => {
      const result = await joinCareHomeAction({ careHomeId, role: "admin" });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("You joined this care home as an admin");
      router.refresh();
    });
  }

  return (
    <Button
      variant="secondary"
      className="rounded-xl"
      disabled={isPending}
      onClick={handleClick}
    >
      <Building2 className="w-4 h-4 mr-2" />
      {isPending ? "Joining..." : "Join as admin"}
    </Button>
  );
}
