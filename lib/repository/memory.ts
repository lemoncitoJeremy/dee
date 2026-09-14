import type {
  AppRepository,
  AppSnapshot,
  Currently,
  CurrentlyInput,
  DeeQuestion,
  Schedule,
  ScheduleInput,
  ScheduleUpdate,
} from "@/lib/types";
import { demoSnapshot } from "@/lib/seed";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function identifier(): string {
  return globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}`;
}

export function createMemoryRepository(
  seed: AppSnapshot = demoSnapshot,
): AppRepository {
  const state = clone(seed);

  return {
    async load() {
      return clone(state);
    },
    async createSchedule(input: ScheduleInput) {
      const schedule: Schedule = {
        ...input,
        id: identifier(),
        notes: input.notes?.trim() || null,
        created_at: new Date().toISOString(),
      };
      state.schedules = [...state.schedules, schedule];
      return clone(schedule);
    },
    async updateSchedule(id: string, input: ScheduleUpdate) {
      const current = state.schedules.find((item) => item.id === id);
      if (!current) throw new Error("Schedule not found.");
      const updated: Schedule = {
        ...current,
        ...input,
        notes: input.notes === undefined ? current.notes : input.notes?.trim() || null,
      };
      state.schedules = state.schedules.map((item) =>
        item.id === id ? updated : item,
      );
      return clone(updated);
    },
    async deleteSchedule(id: string) {
      state.schedules = state.schedules.filter((item) => item.id !== id);
    },
    async updateQuestion(id: string, answer: string) {
      const current = state.questions.find((item) => item.id === id);
      if (!current) throw new Error("Question not found.");
      const updated: DeeQuestion = {
        ...current,
        answer: answer.trim() || null,
        updated_at: new Date().toISOString(),
      };
      state.questions = state.questions.map((item) =>
        item.id === id ? updated : item,
      );
      return clone(updated);
    },
    async updateCurrently(input: CurrentlyInput) {
      const updated: Currently = {
        ...state.currently,
        ...input,
        updated_at: new Date().toISOString(),
      };
      state.currently = updated;
      return clone(updated);
    },
  };
}
