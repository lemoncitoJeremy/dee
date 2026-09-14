import type { Activity, CurrentlyInput, Schedule, ScheduleInput } from "@/lib/types";

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

export function registerAppTools(
  context: ModelContext,
  actions: AppToolActions,
  signal?: AbortSignal,
) {
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
        if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("time must use HH:mm.");
        await actions.addSchedule({
          activity_id: stringValue(value, "activity_id"),
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
        await actions.updateQuestion(stringValue(value, "question_id"), stringValue(value, "answer"));
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
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const value = record(input);
        await actions.updateCurrently({
          listening_to: typeof value.listening_to === "string" ? value.listening_to : null,
          craving: typeof value.craving === "string" ? value.craving : null,
          watching: typeof value.watching === "string" ? value.watching : null,
          thinking_about: typeof value.thinking_about === "string" ? value.thinking_about : null,
        });
        return { status: "saved" };
      },
    },
  ];

  for (const tool of tools) void context.registerTool(tool, { signal });
}
