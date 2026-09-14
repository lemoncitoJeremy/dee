import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWeekRange, startOfWeek } from "@/lib/calendar";
import { Button } from "@/components/ui/button";

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
        <span>{formatWeekRange(anchor)}</span>
        <small>This Week</small>
      </button>
      <Button variant="ghost" size="sm" onClick={() => move(1)} aria-label="Next Week">
        <span className="hidden sm:inline">Next Week</span> <ChevronRight />
      </Button>
    </div>
  );
}
