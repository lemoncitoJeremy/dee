import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfWeek, weekDays } from "@/lib/calendar";
import { Button } from "@/components/ui/button";

function weekLabel(anchor: Date): string {
  const days = weekDays(anchor);
  const start = days[0];
  const end = days[6];
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}, ${end.getFullYear()}`
      : end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  return `${startLabel}–${endLabel}`;
}

export function WeekSwitcher({
  anchor,
  onChange,
}: {
  anchor: Date;
  onChange: (next: Date) => void;
}) {
  const move = (weeks: number) => {
    const next = new Date(anchor);
    next.setDate(next.getDate() + weeks * 7);
    onChange(startOfWeek(next));
  };

  return (
    <div className="week-switcher">
      <Button variant="ghost" size="sm" onClick={() => move(-1)} aria-label="Previous Week">
        <ChevronLeft /> <span className="hidden sm:inline">Previous Week</span>
      </Button>
      <button className="week-date" onClick={() => onChange(startOfWeek(new Date()))}>
        <span>{weekLabel(anchor)}</span>
        <small>This Week</small>
      </button>
      <Button variant="ghost" size="sm" onClick={() => move(1)} aria-label="Next Week">
        <span className="hidden sm:inline">Next Week</span> <ChevronRight />
      </Button>
    </div>
  );
}
