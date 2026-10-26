"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Briefcase,
  Building2,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  UserCog,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "@/features/auth/actions";
import {
  WorkspaceSwitcher,
  type WorkspaceGroup,
  type WorkspaceType,
} from "./workspace-switcher";

interface CareHome {
  id: string;
  name: string | null;
  kind: "family" | "domiciliary" | "residential";
}

interface Organisation {
  id: string;
  name: string | null;
}

interface AppShellProps {
  userEmail?: string | null;
  userRole: boolean;
  careHomes: CareHome[];
  adminCareHomeIds?: string[];
  organisations?: Organisation[];
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function resolveHref(item: NavItem, currentCareHomeId: string | undefined) {
  if (item.href === "/app") {
    return currentCareHomeId ? `/app/care-homes/${currentCareHomeId}` : "/app";
  }
  if (item.href === "/patients" && currentCareHomeId) {
    return `/app/care-homes/${currentCareHomeId}/patients`;
  }
  if (item.href === "/events" && currentCareHomeId) {
    return `/app/care-homes/${currentCareHomeId}/events`;
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
  organisations = [],
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const careHomeMatch = pathname.match(/\/app\/care-homes\/([^/]+)/);
  const orgMatch = pathname.match(/\/app\/organisations\/([^/]+)/);
  const currentOrganisationId = orgMatch?.[1];
  const currentCareHomeId =
    careHomeMatch?.[1] ??
    (currentOrganisationId ? undefined : careHomes[0]?.id);

  const establishments = careHomes.filter((h) => h.kind !== "family");
  const families = careHomes.filter((h) => h.kind === "family");

  const currentCareHome = careHomes.find((h) => h.id === currentCareHomeId);

  const workspaceGroups: WorkspaceGroup[] = [
    ...(establishments.length > 0
      ? [
          {
            type: "establishment" as const,
            label: "Establishments",
            items: establishments,
          },
        ]
      : []),
    ...(families.length > 0
      ? [{ type: "family" as const, label: "Family", items: families }]
      : []),
    ...(organisations.length > 0
      ? [
          {
            type: "organisation" as const,
            label: "Organisations",
            items: organisations,
          },
        ]
      : []),
  ];

  const activeWorkspaceType: WorkspaceType = currentOrganisationId
    ? "organisation"
    : currentCareHome
      ? currentCareHome.kind === "family"
        ? "family"
        : "establishment"
      : establishments.length > 0
        ? "establishment"
        : families.length > 0
          ? "family"
          : "organisation";

  const activeWorkspaceItemId = currentOrganisationId ?? currentCareHomeId;

  const workspaceNavItems: NavItem[] = [
    { name: "Dashboard", href: "/app", icon: LayoutDashboard },
    { name: "Residents", href: "/patients", icon: Users },
    { name: "All events", href: "/events", icon: Activity },
    { name: "Members", href: "/members", icon: UserCog },
  ];

  const adminItems: NavItem[] = [
    { name: "Establishments", href: "/app/admin", icon: Building2 },
    {
      name: "Organisations",
      href: "/app/admin/organisations",
      icon: Briefcase,
    },
    { name: "Users", href: "/app/admin/users", icon: Shield },
  ];

  const showWorkspaceNav = activeWorkspaceType !== "organisation";

  const allNavItems = [...workspaceNavItems, ...(userRole ? adminItems : [])];

  const activeNavItem = (() => {
    const candidates = allNavItems
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

  const currentCareHomeName = currentCareHome?.name ?? "Establishment";
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
          <div className="space-y-2 px-3">
            <WorkspaceSwitcher
              groups={workspaceGroups}
              activeType={activeWorkspaceType}
              activeItemId={activeWorkspaceItemId}
            />
            {viewingNonMemberCareHome && (
              <div className="text-xs text-muted-foreground px-1">
                Viewing:{" "}
                <span className="font-medium text-foreground">
                  {currentCareHomeName}
                </span>
              </div>
            )}
          </div>

          {showWorkspaceNav && (
            <div className="space-y-1">
              {workspaceNavItems.map((item) => {
                const href = resolveHref(item, currentCareHomeId);
                const active = isActive(item);
                const Icon = item.icon;

                const requiresCareHome =
                  item.href === "/patients" ||
                  item.href === "/events" ||
                  item.href === "/members";
                if (requiresCareHome && !currentCareHomeId) {
                  return null;
                }

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
          )}

          {userRole && (
            <div className="space-y-1">
              <div className="px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Administration
                </span>
              </div>
              {adminItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
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
          )}
        </nav>

        <Separator />

        <div className="p-4 space-y-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <Link href="/app/account">
              <Settings className="w-4 h-4 mr-2" />
              Account
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <Link href="/help">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <Link href="/home">
              <Home className="w-4 h-4 mr-2" />
              Visit website
            </Link>
          </Button>
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
