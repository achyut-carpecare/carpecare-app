import "server-only"; // <-- ensure this file cannot be imported from the client
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: async () =>
    createTRPCContext({
      headers: await headers(),
    }),
  router: appRouter,
  queryClient: getQueryClient,
});
// If your router is on a separate server, pass a client instead:
// createTRPCOptionsProxy({
//   client: createTRPCClient({ links: [httpLink({ url: '...' })] }),
//   queryClient: getQueryClient,
// });

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

// Narrow helper to detect infinite queries without using explicit `any`.
function isInfiniteMarker(q: unknown): boolean {
  if (q == null) return false;
  if (typeof q !== "object") return false;
  const maybeKey = (q as Record<string, unknown>).queryKey;
  if (!Array.isArray(maybeKey)) return false;
  const second = maybeKey[1];
  if (second == null || typeof second !== "object") return false;
  return (second as Record<string, unknown>).type === "infinite";
}

export function prefetch(...queryOptionsArr: unknown[]) {
  const queryClient = getQueryClient();
  for (const queryOptions of queryOptionsArr) {
    if (isInfiniteMarker(queryOptions)) {
      void queryClient.prefetchInfiniteQuery(
        queryOptions as Parameters<QueryClient["prefetchInfiniteQuery"]>[0],
      );
    } else {
      void queryClient.prefetchQuery(
        queryOptions as Parameters<QueryClient["prefetchQuery"]>[0],
      );
    }
  }
}
