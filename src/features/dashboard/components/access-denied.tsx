import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground" />
      <h1 className="text-2xl font-bold">You don&apos;t have access to this</h1>
      <p className="text-muted-foreground">
        You don&apos;t have permission to view this page. Contact an
        administrator if you think this is a mistake.
      </p>
      <Button asChild variant="secondary" className="rounded-xl">
        <Link href="/app">Back to dashboard</Link>
      </Button>
    </div>
  );
}
