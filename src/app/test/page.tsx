import { ClientGreeting } from "./client-greeting";
import { HydrateClient, prefetch, trpc } from "../trpc/server";
import { Suspense } from "react";

export default function TestPage() {
  prefetch(trpc.hello.queryOptions({ text: "world" }));

  return (
    <HydrateClient>
      <Suspense fallback={<div>Loading...</div>}>
        <ClientGreeting />
      </Suspense>
    </HydrateClient>
  );
}
