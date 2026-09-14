"use client";

import { useMemo, useState } from "react";
import { CalendarHeart } from "lucide-react";
import { dateKey, formatTime, groupSchedulesByDate, isDateInWeek, startOfWeek, weekDays } from "@/lib/calendar";
import { useAppData } from "@/lib/repository/provider";
import type { Schedule } from "@/lib/types";
import { WeekSwitcher } from "@/components/week-switcher";
import { ScheduleDialog } from "@/components/schedule-dialog";

const activityTone: Record<string, string> = {
  "00000000-0000-0000-0000-000000000101": "event-matcha",
  "00000000-0000-0000-0000-000000000102": "event-racing",
  "00000000-0000-0000-0000-000000000103": "event-chili",
  "00000000-0000-0000-0000-000000000104": "event-sushi",
};

export function ScheduleView() {
  const { snapshot, createSchedule, updateSchedule, deleteSchedule } = useAppData();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState<Schedule | undefined>();
  const days = weekDays(anchor);
  const schedules = useMemo(() => snapshot.schedules.filter((item) => isDateInWeek(item.date, anchor)), [anchor, snapshot.schedules]);
  const grouped = groupSchedulesByDate(schedules);
  const activity = selected ? snapshot.activities.find((item) => item.id === selected.activity_id) : undefined;

  return (
    <section className="content-wrap schedule-page">
      <header className="page-heading schedule-title">
        <div className="heading-mark"><CalendarHeart /></div>
        <div><p className="eyebrow">schedule</p><h1>All our little plans</h1><p>Everything we’re looking forward to, in one place.</p></div>
      </header>
      <WeekSwitcher anchor={anchor} onChange={setAnchor} />

      <div className="mobile-agenda">
        {days.map((day) => {
          const items = grouped.get(dateKey(day)) ?? [];
          return (
            <article className="agenda-day" key={dateKey(day)}>
              <header><strong>{day.toLocaleDateString("en-US", { weekday: "long" })}</strong><span>{day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></header>
              {items.length ? items.map((item) => {
                const itemActivity = snapshot.activities.find((candidate) => candidate.id === item.activity_id);
                return <button key={item.id} className={`agenda-event ${activityTone[item.activity_id] ?? ""}`} onClick={() => setSelected(item)} aria-label={`${itemActivity?.name} ${formatTime(item.time)} ${item.notes ?? ""}`}><span className="event-emoji">{itemActivity?.icon}</span><span><strong>{itemActivity?.name}</strong><small>{formatTime(item.time)} · {item.notes || "A little plan"}</small></span></button>;
              }) : <p className="agenda-empty">Nothing planned—yet.</p>}
            </article>
          );
        })}
      </div>

      <div className="desktop-calendar">
        <div className="calendar-corner">time</div>
        {days.map((day) => <div className="calendar-day-head" key={dateKey(day)}><span>{day.toLocaleDateString("en-US", { weekday: "short" })}</span><strong>{day.getDate()}</strong></div>)}
        {Array.from({ length: 14 }, (_, index) => index + 9).map((hour) => (
          <div className="contents" key={hour}>
            <time className="calendar-hour">{String(hour).padStart(2, "0")}:00</time>
            {days.map((day) => {
              const items = (grouped.get(dateKey(day)) ?? []).filter((item) => Number(item.time.slice(0, 2)) === hour);
              return <div className="calendar-cell" key={`${dateKey(day)}-${hour}`}>{items.map((item) => {
                const itemActivity = snapshot.activities.find((candidate) => candidate.id === item.activity_id);
                return <button key={item.id} className={`grid-event ${activityTone[item.activity_id] ?? ""}`} onClick={() => setSelected(item)} aria-label={`${itemActivity?.name} ${formatTime(item.time)} ${item.notes ?? ""}`}><span>{itemActivity?.icon} {itemActivity?.name}</span><small>{formatTime(item.time)}</small></button>;
              })}</div>;
            })}
          </div>
        ))}
      </div>
      {schedules.length === 0 && <div className="calendar-empty-overlay"><span>💌</span><p>This week is waiting for a little plan.</p></div>}

      {selected && activity && (
        <ScheduleDialog
          open
          onOpenChange={(open) => { if (!open) setSelected(undefined); }}
          activity={activity}
          schedule={selected}
          defaultDate={selected.date}
          onCreate={createSchedule}
          onUpdate={updateSchedule}
          onDelete={deleteSchedule}
        />
      )}
    </section>
  );
}
