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
  Shield,
  Users,
  UserCog,
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
  userRole: boolean;
  careHomes: CareHome[];
  adminCareHomeIds?: string[];
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function resolveHref(item: NavItem, currentCareHomeId: string | undefined) {
  if (item.href === "/app") {
    return currentCareHomeId ? `/app/care-homes/${currentCareHomeId}` : "/app";
  }
  if (item.href === "/patients" && currentCareHomeId) {
    return `/app/care-homes/${currentCareHomeId}/patients`;
  }
  if (item.href === "/members" && currentCareHomeId) {
    return `/app/care-homes/${currentCareHomeId}/members`;
  }
  return item.href;
}

export function AppShell({
  userEmail,
  userRole,
  careHomes,
  adminCareHomeIds = [],
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const careHomeMatch = pathname.match(/\/app\/care-homes\/([^\/]+)/);
  const currentCareHomeId = careHomeMatch?.[1] ?? careHomes[0]?.id;

  const careHomeSection: NavSection = {
    title: "Care home",
    items: [
      { name: "Dashboard", href: "/app", icon: LayoutDashboard },
      { name: "Residents", href: "/patients", icon: Users },
      { name: "Members", href: "/members", icon: UserCog },
    ],
  };

  const adminSection: NavSection = {
    title: "Administration",
    items: [
      { name: "Care homes", href: "/app/admin", icon: Building2 },
      { name: "Users", href: "/app/admin/users", icon: Shield },
    ],
  };

  const sections: NavSection[] = [careHomeSection];
  if (userRole) {
    sections.push(adminSection);
  }

  const activeNavItem = (() => {
    const allItems = sections.flatMap((section) => section.items);
    const candidates = allItems
      .map((item) => ({ item, href: resolveHref(item, currentCareHomeId) }))
      .filter(({ href }) => {
        if (href === "/app") return pathname === "/app";
        return pathname.startsWith(href);
      })
      .sort((a, b) => b.href.length - a.href.length);

    return candidates[0]?.item ?? null;
  })();

  function isActive(item: NavItem) {
    return item === activeNavItem;
  }

  const isMemberOfCurrentCareHome = currentCareHomeId
    ? careHomes.some((h) => h.id === currentCareHomeId)
    : false;
  const isAdminOfCurrentCareHome = currentCareHomeId
    ? adminCareHomeIds.includes(currentCareHomeId)
    : false;

  const currentCareHome = careHomes.find((h) => h.id === currentCareHomeId);
  const currentCareHomeName = currentCareHome?.name ?? "Care home";
  const viewingNonMemberCareHome =
    !!currentCareHomeId && !isMemberOfCurrentCareHome;

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

        <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </span>
              </div>
              {section.title === "Care home" && (
                <div className="px-3 pb-2">
                  {careHomes.length > 0 ? (
                    <CareHomeSwitcher
                      careHomes={careHomes}
                      currentCareHomeId={currentCareHomeId ?? careHomes[0].id}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground px-1">
                      Not a member of any care home
                    </div>
                  )}
                  {viewingNonMemberCareHome && (
                    <div className="mt-2 text-xs text-muted-foreground px-1">
                      Viewing:{" "}
                      <span className="font-medium text-foreground">
                        {currentCareHomeName}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {section.items.map((item) => {
                const href = resolveHref(item, currentCareHomeId);
                const active = isActive(item);
                const Icon = item.icon;

                if (
                  item.href === "/members" &&
                  !userRole &&
                  !isAdminOfCurrentCareHome
                ) {
                  return null;
                }

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
            </div>
          ))}
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
