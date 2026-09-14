"use client";

import { useState, type FormEvent } from "react";
import type { Activity, Schedule, ScheduleInput } from "@/lib/types";
import { formatTime } from "@/lib/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ScheduleDialog({
  open,
  onOpenChange,
  activity,
  schedule,
  defaultDate,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  schedule?: Schedule;
  defaultDate: string;
  onCreate: (input: ScheduleInput) => Promise<void>;
  onUpdate: (id: string, input: ScheduleInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(!schedule);
  const [confirming, setConfirming] = useState(false);
  const [date, setDate] = useState(schedule?.date ?? defaultDate);
  const [time, setTime] = useState(schedule?.time.slice(0, 5) ?? "18:00");
  const [notes, setNotes] = useState(schedule?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const input: ScheduleInput = {
      activity_id: activity.id,
      date,
      time: `${time}:00`,
      notes,
    };
    try {
      if (schedule) await onUpdate(schedule.id, input);
      else await onCreate(input);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="schedule-dialog">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {schedule && !editing ? "A little plan" : schedule ? "Edit this plan" : "Add a little plan"}
            </DialogTitle>
            <DialogDescription>{activity.icon} {activity.name}</DialogDescription>
          </DialogHeader>
          {schedule && !editing ? (
            <div className="detail-card">
              <dl>
                <div><dt>Activity</dt><dd>{activity.icon} {activity.name}</dd></div>
                <div><dt>Date</dt><dd>{new Date(`${schedule.date}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "long" })}</dd></div>
                <div><dt>Time</dt><dd>{formatTime(schedule.time)}</dd></div>
                <div><dt>Notes</dt><dd>{schedule.notes || "No note—just us."}</dd></div>
              </dl>
              <DialogFooter>
                <Button variant="destructive" onClick={() => setConfirming(true)}>Delete</Button>
                <Button onClick={() => setEditing(true)}>Edit</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={save} className="space-y-5">
              <div className="field-row">
                <div><Label htmlFor="schedule-date">Date</Label><Input id="schedule-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></div>
                <div><Label htmlFor="schedule-time">Time</Label><Input id="schedule-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></div>
              </div>
              <div>
                <Label htmlFor="schedule-notes">Notes</Label>
                <Textarea id="schedule-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Try that new matcha place" />
              </div>
              <DialogFooter>
                {schedule && <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Schedule"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this little plan?</AlertDialogTitle>
            <AlertDialogDescription>This removes it from every calendar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!schedule) return;
                await onDelete(schedule.id);
                setConfirming(false);
                onOpenChange(false);
              }}
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
