import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Activity, ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/features/auth/server";
import { db } from "@/features/database";
import {
  getCareHomeById,
  getPatients,
  getSeizureRecordsForCareHome,
  countSeizureRecordsForCareHome,
  getDistinctSeizureTypesForCareHome,
  getUserWithMemberships,
} from "@/features/database/queries";
import { PageHeader } from "@/features/dashboard/components/page-header";
import { AccessDenied } from "@/features/dashboard/components/access-denied";
import {
  formatDateTime,
  formatDuration,
  formatName,
} from "@/features/dashboard/lib/format";

const PAGE_SIZE = 25;

interface EventsPageProps {
  params: Promise<{ careHomeId: string }>;
  searchParams: Promise<{
    patientId?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

function buildQueryString(
  filters: Record<string, string | undefined>,
  overrides: Record<string, string | undefined> = {},
) {
  const params = new URLSearchParams();
  const merged = { ...filters, ...overrides };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default async function EventsPage({
  params,
  searchParams,
}: EventsPageProps) {
  const { careHomeId } = await params;
  const { patientId, type, from, to, page } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const result = await getUserWithMemberships(db, user.id);
  if (!result) {
    redirect("/auth/login");
  }

  const { profile, memberships } = result;
  const isMember = memberships.some((m) => m.careHome.id === careHomeId);

  if (!isMember && !profile.isSystemAdmin) {
    return <AccessDenied />;
  }

  const careHome = await getCareHomeById(db, careHomeId);
  if (!careHome) {
    notFound();
  }

  const currentPage = Math.max(1, Number(page) || 1);
  const filters = { patientId, seizureType: type, from, to };

  const [records, totalCount, patients, seizureTypes] = await Promise.all([
    getSeizureRecordsForCareHome(db, careHomeId, {
      ...filters,
      offset: (currentPage - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    }),
    countSeizureRecordsForCareHome(db, careHomeId, filters),
    getPatients(db, { careHomeId }),
    getDistinctSeizureTypesForCareHome(db, careHomeId),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const queryFilters = { patientId, type, from, to };

  return (
    <div className="space-y-6">
      <PageHeader
        title="All events"
        subtitle={`Every seizure record logged at ${careHome.name ?? "this care home"}`}
      />

      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <form
            method="GET"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="space-y-2">
              <Label htmlFor="patientId">Resident</Label>
              <select
                id="patientId"
                name="patientId"
                defaultValue={patientId ?? ""}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
              >
                <option value="">All residents</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatName(p.firstName, p.lastName)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Seizure type</Label>
              <select
                id="type"
                name="type"
                defaultValue={type ?? ""}
                className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
              >
                <option value="">All types</option>
                {seizureTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={from ?? ""}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={to ?? ""}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" className="rounded-xl w-full">
                Apply filters
              </Button>
              {(patientId || type || from || to) && (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href={`/app/care-homes/${careHomeId}/events`}>
                    Clear
                  </Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No events match these filters.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Recorded by</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDateTime(record.recordedAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/app/care-homes/${careHomeId}/patients/${record.patientId}`}
                        className="hover:underline"
                      >
                        {formatName(
                          record.patientFirstName,
                          record.patientLastName,
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>{record.seizureType ?? "—"}</TableCell>
                    <TableCell>
                      {formatDuration(record.durationSeconds)}
                    </TableCell>
                    <TableCell>
                      {formatName(
                        record.recorderFirstName,
                        record.recorderLastName,
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                      >
                        <Link
                          href={`/app/care-homes/${careHomeId}/patients/${record.patientId}/seizure-records/${record.id}`}
                        >
                          View
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} · {totalCount} events
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentPage <= 1}
            >
              <Link
                href={`/app/care-homes/${careHomeId}/events${buildQueryString(
                  queryFilters,
                  { page: String(currentPage - 1) },
                )}`}
              >
                Previous
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={currentPage >= totalPages}
            >
              <Link
                href={`/app/care-homes/${careHomeId}/events${buildQueryString(
                  queryFilters,
                  { page: String(currentPage + 1) },
                )}`}
              >
                Next
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
