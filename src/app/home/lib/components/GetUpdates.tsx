"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";

export function GetUpdates() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, just open mailto as a fallback
    window.location.href = `mailto:contact@carpecare.co.uk?subject=Carpe%20Care%20Updates&body=Please%20add%20${encodeURIComponent(email)}%20to%20your%20updates%20list.`;
  };

  return (
    <section id="updates" className="w-full bg-muted/30 py-20 md:py-28">
      <div className="layout-content px-4">
        <div className="layout-center flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Bell className="size-6 text-primary" />
          </div>

          <h2
            className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Get Updates
          </h2>

          <p className="mt-3 text-muted-foreground">
            Be the first to hear the latest Carpe Care updates.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-full border-border/60 bg-background px-5"
            />
            <Button type="submit" className="h-11 rounded-full px-6">
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
