interface DotCalendarProps {
  eventDays: Map<number, number>;
}

export function DotCalendar({ eventDays }: DotCalendarProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  // Adjust so Monday is first column.
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const headers = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 max-w-[220px]">
        {headers.map((h, i) => (
          <div
            key={i}
            className="text-[10px] text-center text-muted-foreground font-semibold"
          >
            {h}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const count = eventDays.get(day) ?? 0;
          const today = now.getDate() === day;

          return (
            <div
              key={day}
              title={
                count > 0 ? `${count} event${count > 1 ? "s" : ""}` : undefined
              }
              className={[
                "aspect-square rounded-md transition-colors",
                today ? "ring-2 ring-primary ring-offset-1" : "",
                count === 0
                  ? "bg-muted"
                  : count === 1
                    ? "bg-amber-500"
                    : "bg-orange-700",
              ].join(" ")}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        One dot = one day with an event. Darker dots had more than one.
      </p>
    </div>
  );
}
