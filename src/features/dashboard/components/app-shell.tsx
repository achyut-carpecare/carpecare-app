"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/features/auth/actions";
import { CareHomeSwitcher } from "./care-home-switcher";

interface CareHome {
  id: string;
  name: string | null;
}

interface AppShellProps {
  userEmail?: string | null;
  userRole: "system_admin" | "care_home_user";
  careHomes: CareHome[];
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    name: "Patients",
    href: "/patients",
    icon: Users,
    adminOnly: false,
  },
  {
    name: "Care homes",
    href: "/app/admin",
    icon: Building2,
    adminOnly: true,
  },
];

export function AppShell({
  userEmail,
  userRole,
  careHomes,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminView = pathname.startsWith("/app/admin");
  const effectiveRole = isAdminView ? "system_admin" : userRole;
  const visibleNav = navItems.filter((item) => {
    if (item.adminOnly) return effectiveRole === "system_admin";
    return effectiveRole !== "system_admin";
  });

  const careHomeMatch = pathname.match(/\/app\/care-homes\/([^\/]+)/);
  const currentCareHomeId = careHomeMatch?.[1] ?? careHomes[0]?.id;

  function resolveHref(item: NavItem) {
    if (item.href === "/app") {
      return currentCareHomeId
        ? `/app/care-homes/${currentCareHomeId}`
        : "/app";
    }
    if (item.href === "/patients" && currentCareHomeId) {
      return `/app/care-homes/${currentCareHomeId}/patients`;
    }
    return item.href;
  }

  function isActive(item: NavItem) {
    const href = resolveHref(item);
    if (href === "/app" && pathname === "/app") return true;
    return pathname.startsWith(href) && href !== "/app";
  }

  return (
    <div className="min-h-full flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border shadow-sm"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] border-r border-border bg-card flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-border">
          <Link href="/app" className="flex items-center gap-2">
            <Home className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Carpe Care</span>
          </Link>
        </div>

        {!isAdminView && careHomes.length > 0 && (
          <div className="p-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Care home
            </label>
            <CareHomeSwitcher
              careHomes={careHomes}
              currentCareHomeId={currentCareHomeId ?? careHomes[0].id}
            />
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => {
            const href = resolveHref(item);
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="p-4 space-y-3">
          {userEmail && (
            <div className="text-xs text-muted-foreground truncate">
              {userEmail}
            </div>
          )}
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-h-screen p-6 pt-16 lg:pt-6">{children}</main>
    </div>
  );
}
