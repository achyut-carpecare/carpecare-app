"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MAX_AUTO_FINISH_MS = 8000;

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoFinishRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (autoFinishRef.current) {
      clearTimeout(autoFinishRef.current);
      autoFinishRef.current = null;
    }
  }

  function start() {
    clearTimers();
    setVisible(true);
    setProgress(8);
    trickleRef.current = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + (90 - p) * 0.1));
    }, 200);
    autoFinishRef.current = setTimeout(done, MAX_AUTO_FINISH_MS);
  }

  function done() {
    clearTimers();
    setProgress(100);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 200);
  }

  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  useEffect(() => {
    function isModifiedClick(e: MouseEvent) {
      return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    }

    function onClick(e: MouseEvent) {
      if (isModifiedClick(e)) return;
      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (
        url.pathname + url.search ===
        window.location.pathname + window.location.search
      ) {
        return;
      }

      start();
    }

    document.addEventListener("click", onClick);

    const originalPushState = window.history.pushState.bind(window.history);
    window.history.pushState = function (...args) {
      start();
      return originalPushState(...args);
    };

    return () => {
      document.removeEventListener("click", onClick);
      window.history.pushState = originalPushState;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[100] h-[3px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-primary"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100 ? "width 200ms ease" : "width 300ms ease-out",
        }}
      />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
