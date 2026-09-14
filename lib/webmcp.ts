import type { Activity, CurrentlyInput, DeeQuestion, Schedule, ScheduleInput } from "@/lib/types";

export type RegisteredTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};

type ModelContext = {
  registerTool: (
    tool: RegisteredTool,
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

type AppToolActions = {
  listActivities: () => Activity[];
  listSchedules: () => Schedule[];
  listQuestions: () => DeeQuestion[];
  addSchedule: (input: ScheduleInput) => Promise<void> | void;
  updateQuestion: (id: string, answer: string) => Promise<void> | void;
  updateCurrently: (input: CurrentlyInput) => Promise<void> | void;
};

function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object.");
  }
  return input as Record<string, unknown>;
}

function stringValue(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  return value;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

function validTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");
}

export async function registerAppTools(
  context: ModelContext,
  actions: AppToolActions,
  signal?: AbortSignal,
): Promise<void> {
  const tools: RegisteredTool[] = [
    {
      name: "list_activities",
      title: "List activities",
      description: "List the activities available in Wanna Know Dee.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ activities: actions.listActivities() }),
    },
    {
      name: "list_schedules",
      title: "List schedules",
      description: "List scheduled activities, optionally between two local dates.",
      inputSchema: {
        type: "object",
        properties: { start_date: { type: "string" }, end_date: { type: "string" } },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: (input) => {
        const value = record(input);
        const start = typeof value.start_date === "string" ? value.start_date : undefined;
        const end = typeof value.end_date === "string" ? value.end_date : undefined;
        const schedules = actions.listSchedules().filter((item) => (!start || item.date >= start) && (!end || item.date <= end));
        return { schedules };
      },
    },
    {
      name: "add_schedule",
      title: "Add schedule",
      description: "Add an activity to the shared calendar using a local date and time.",
      inputSchema: {
        type: "object",
        properties: {
          activity_id: { type: "string" },
          date: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
          time: { type: "string", pattern: "^\\d{2}:\\d{2}$" },
          notes: { type: "string" },
        },
        required: ["activity_id", "date", "time"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = record(input);
        const date = stringValue(value, "date");
        const time = stringValue(value, "time");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("date must use YYYY-MM-DD.");
        if (!validDate(date)) throw new Error("date must be a valid calendar date.");
        if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("time must use HH:mm.");
        if (!validTime(time)) throw new Error("time must be a valid 24-hour time.");
        const activityId = stringValue(value, "activity_id");
        if (!actions.listActivities().some((activity) => activity.id === activityId)) {
          throw new Error("activity_id must identify an available activity.");
        }
        await actions.addSchedule({
          activity_id: activityId,
          date,
          time: `${time}:00`,
          notes: typeof value.notes === "string" ? value.notes : null,
        });
        return { status: "created" };
      },
    },
    {
      name: "update_dee_answer",
      title: "Update Dee answer",
      description: "Save Dee's answer to one of the small personal questions.",
      inputSchema: {
        type: "object",
        properties: { question_id: { type: "string" }, answer: { type: "string" } },
        required: ["question_id", "answer"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = record(input);
        const questionId = stringValue(value, "question_id");
        if (!actions.listQuestions().some((question) => question.id === questionId)) {
          throw new Error("question_id must identify an available question.");
        }
        await actions.updateQuestion(questionId, stringValue(value, "answer"));
        return { status: "saved" };
      },
    },
    {
      name: "update_dee_currently",
      title: "Update Dee currently",
      description: "Save what Dee is listening to, craving, watching, or thinking about.",
      inputSchema: {
        type: "object",
        properties: {
          listening_to: { type: "string" }, craving: { type: "string" },
          watching: { type: "string" }, thinking_about: { type: "string" },
        },
        required: ["listening_to", "craving", "watching", "thinking_about"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = record(input);
        const required = ["listening_to", "craving", "watching", "thinking_about"] as const;
        if (!required.every((key) => typeof value[key] === "string")) {
          throw new Error("Currently updates must include all four text fields.");
        }
        await actions.updateCurrently({
          listening_to: stringValue(value, "listening_to").trim() || null,
          craving: stringValue(value, "craving").trim() || null,
          watching: stringValue(value, "watching").trim() || null,
          thinking_about: stringValue(value, "thinking_about").trim() || null,
        });
        return { status: "saved" };
      },
    },
  ];

  const registrations = tools.map((tool) => {
    try {
      return Promise.resolve(context.registerTool(tool, { signal })).catch((error) => {
        if (!isAbortError(error)) throw error;
      });
    } catch (error) {
      if (!isAbortError(error)) throw error;
      return Promise.resolve();
    }
  });

  await Promise.all(registrations);
}
