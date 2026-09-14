import { describe, expect, it } from "vitest";
import {
  dateKey,
  groupSchedulesByDate,
  startOfWeek,
  weekDays,
} from "@/lib/calendar";
import type { Schedule } from "@/lib/types";

describe("calendar helpers", () => {
  it("starts weeks on Monday without shifting the local date", () => {
    expect(dateKey(startOfWeek(new Date(2026, 8, 17)))).toBe("2026-09-14");
  });

  it("returns exactly seven local calendar days", () => {
    expect(weekDays(new Date(2026, 8, 17)).map(dateKey)).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
  });

  it("groups schedules by stored date and sorts by stored time", () => {
    const schedules: Schedule[] = [
      {
        id: "later",
        activity_id: "matcha",
        date: "2026-09-17",
        time: "18:00:00",
        notes: "Evening",
        created_at: "2026-09-14T00:00:00Z",
      },
      {
        id: "earlier",
        activity_id: "matcha",
        date: "2026-09-17",
        time: "13:00:00",
        notes: "Afternoon",
        created_at: "2026-09-14T00:00:00Z",
      },
    ];

    expect(
      groupSchedulesByDate(schedules).get("2026-09-17")?.map((item) => item.id),
    ).toEqual(["earlier", "later"]);
  });
});
