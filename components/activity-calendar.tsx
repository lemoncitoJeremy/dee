"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { dateKey, formatTime, groupSchedulesByDate, isDateInWeek, startOfWeek, weekDays } from "@/lib/calendar";
import type { Activity, Schedule } from "@/lib/types";
import { useAppData } from "@/lib/repository/provider";
import { Button } from "@/components/ui/button";
import { WeekSwitcher } from "@/components/week-switcher";
import { ScheduleDialog } from "@/components/schedule-dialog";

export function ActivityCalendar({ activity, onBack }: { activity: Activity; onBack: () => void }) {
  const { snapshot, createSchedule, updateSchedule, deleteSchedule } = useAppData();
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSession, setDialogSession] = useState(0);
  const [selected, setSelected] = useState<Schedule | undefined>();
  const days = weekDays(anchor);
  const schedules = useMemo(
    () => snapshot.schedules.filter((item) => item.activity_id === activity.id && isDateInWeek(item.date, anchor)),
    [activity.id, anchor, snapshot.schedules],
  );
  const grouped = groupSchedulesByDate(schedules);

  const openNew = () => {
    setSelected(undefined);
    setDialogSession((current) => current + 1);
    setDialogOpen(true);
  };

  return (
    <section className="content-wrap">
      <button className="back-button" onClick={onBack}><ArrowLeft /> All activities</button>
      <header className="activity-heading">
        <div className="activity-heading-icon">{activity.icon}</div>
        <div><p className="eyebrow">activity calendar</p><h1>{activity.name}</h1><p>{activity.description}</p></div>
        <Button className="add-button" onClick={openNew}><Plus /> Add Schedule</Button>
      </header>
      <WeekSwitcher anchor={anchor} onChange={setAnchor} />
      <div className="day-grid">
        {days.map((day) => {
          const items = grouped.get(dateKey(day)) ?? [];
          return (
            <article className="day-card" key={dateKey(day)}>
              <header><span>{day.toLocaleDateString("en-US", { weekday: "short" })}</span><strong>{day.getDate()}</strong></header>
              <div className="day-events">
                {items.map((item) => (
                  <button
                    key={item.id}
                    className="event-pill"
                    aria-label={`${formatTime(item.time)} ${item.notes || activity.name}`}
                    onClick={() => { setSelected(item); setDialogSession((current) => current + 1); setDialogOpen(true); }}
                  >
                    <time>{formatTime(item.time)}</time>
                    <span>{item.notes || activity.name}</span>
                  </button>
                ))}
                {items.length === 0 && <span className="empty-day">open for something nice</span>}
              </div>
            </article>
          );
        })}
      </div>
      {schedules.length === 0 && <div className="empty-week"><span>♡</span><p>No plans this week yet.</p><button onClick={openNew}>Let’s add one →</button></div>}
      <ScheduleDialog
        key={`${selected?.id ?? "new"}-${dialogSession}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activity={activity}
        schedule={selected}
        defaultDate={dateKey(days[3])}
        onCreate={createSchedule}
        onUpdate={updateSchedule}
        onDelete={deleteSchedule}
      />
    </section>
  );
}
