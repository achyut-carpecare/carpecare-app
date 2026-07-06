"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "../lib/actions";
import { toast } from "@/components/ui/sonner";

interface DeleteUserButtonProps {
  userId: string;
  disabled?: boolean;
}

export function DeleteUserButton({ userId, disabled }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleClick() {
    startTransition(async () => {
      const result = await deleteUserAction(userId);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("User deleted");
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled || isPending}
      aria-label="Delete user"
      className="text-destructive hover:text-destructive"
      onClick={handleClick}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
