import type { Schedule } from "@/lib/types";

export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = result.getDay() === 0 ? -6 : 1 - result.getDay();
  result.setDate(result.getDate() + mondayOffset);
  return result;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekDays(anchor: Date): Date[] {
  const monday = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

export function groupSchedulesByDate(
  schedules: Schedule[],
): Map<string, Schedule[]> {
  const grouped = new Map<string, Schedule[]>();
  for (const schedule of schedules) {
    grouped.set(schedule.date, [...(grouped.get(schedule.date) ?? []), schedule]);
  }
  for (const [key, values] of grouped) {
    grouped.set(key, values.sort((a, b) => a.time.localeCompare(b.time)));
  }
  return grouped;
}

export function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function shiftWeek(anchor: Date, amount: number): Date {
  const shifted = new Date(anchor);
  shifted.setDate(shifted.getDate() + amount * 7);
  return shifted;
}

export function formatWeekRange(anchor: Date): string {
  const days = weekDays(anchor);
  const start = days[0];
  const end = days[6];
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = start.getMonth() === end.getMonth()
    ? `${end.getDate()}, ${end.getFullYear()}`
    : end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel}–${endLabel}`;
}

export function isDateInWeek(value: string, anchor: Date): boolean {
  const key = dateKey(startOfWeek(anchor));
  return value >= key && value <= dateKey(weekDays(anchor)[6]);
}

export function formatTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}
