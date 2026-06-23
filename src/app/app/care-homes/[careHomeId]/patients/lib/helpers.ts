export function patientStatus(daysSince: number | null) {
  if (daysSince === null)
    return { label: "No events", variant: "secondary" as const };
  if (daysSince === 0)
    return { label: "Today", variant: "destructive" as const };
  if (daysSince <= 3)
    return { label: `${daysSince}d`, variant: "warning" as const };
  return { label: "Stable", variant: "default" as const };
}

export function daysSince(date: string | null | undefined) {
  if (!date) return null;
  const then = new Date(date);
  const now = new Date();
  const diff = now.getTime() - then.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function formatName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ") || "Unknown";
}
