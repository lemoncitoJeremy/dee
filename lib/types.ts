export type Activity = {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
};

export type Schedule = {
  id: string;
  activity_id: string;
  date: string;
  time: string;
  notes: string | null;
  created_at: string;
};

export type DeeQuestion = {
  id: string;
  question: string;
  answer: string | null;
  icon: string;
  created_at: string;
  updated_at: string;
};

export type Currently = {
  id: string;
  listening_to: string | null;
  craving: string | null;
  watching: string | null;
  thinking_about: string | null;
  updated_at: string;
};

export type AppSnapshot = {
  activities: Activity[];
  schedules: Schedule[];
  questions: DeeQuestion[];
  currently: Currently;
};

export type ScheduleInput = Pick<
  Schedule,
  "activity_id" | "date" | "time" | "notes"
>;

export type ScheduleUpdate = Partial<ScheduleInput>;

export type CurrentlyInput = Pick<
  Currently,
  "listening_to" | "craving" | "watching" | "thinking_about"
>;

export interface AppRepository {
  load(): Promise<AppSnapshot>;
  createSchedule(input: ScheduleInput): Promise<Schedule>;
  updateSchedule(id: string, input: ScheduleUpdate): Promise<Schedule>;
  deleteSchedule(id: string): Promise<void>;
  updateQuestion(id: string, answer: string): Promise<DeeQuestion>;
  updateCurrently(input: CurrentlyInput): Promise<Currently>;
}
