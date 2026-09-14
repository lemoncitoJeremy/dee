import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseRepository } from "@/lib/repository/supabase";
import { demoSnapshot } from "@/lib/seed";

type Result = { data: unknown; error: unknown };
type MutationMethod = "insert" | "update" | "delete" | "upsert";

function query(result: Result) {
  const builder = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

function mutationClient(expectation: {
  table: string;
  method: MutationMethod;
  payload?: unknown;
  eq?: [string, string];
  result: Result;
}) {
  const builder = {
    insert(payload: unknown) { return start("insert", payload); },
    update(payload: unknown) { return start("update", payload); },
    delete() { return start("delete"); },
    upsert(payload: unknown) { return start("upsert", payload); },
    eq(column: string, value: string) {
      if (!expectation.eq || column !== expectation.eq[0] || value !== expectation.eq[1]) {
        throw new Error(`Unexpected filter: ${column}=${value}`);
      }
      return builder;
    },
    select: () => builder,
    single: () => Promise.resolve(expectation.result),
    then: (resolve: (value: Result) => unknown) => Promise.resolve(expectation.result).then(resolve),
  };
  function start(method: MutationMethod, payload?: unknown) {
    if (method !== expectation.method) throw new Error(`Expected ${expectation.method}, received ${method}`);
    if (JSON.stringify(payload) !== JSON.stringify(expectation.payload)) throw new Error("Unexpected mutation payload");
    return builder;
  }
  return {
    from(table: string) {
      if (table !== expectation.table) throw new Error(`Unexpected table: ${table}`);
      return builder;
    },
  } as unknown as SupabaseClient;
}

describe("Supabase repository", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads when the optional currently row has not been created yet", async () => {
    const results: Record<string, Result> = {
      activities: { data: demoSnapshot.activities, error: null },
      schedules: { data: [], error: null },
      dee_questions: { data: demoSnapshot.questions, error: null },
      currently: { data: null, error: null },
    };
    const client = {
      from: vi.fn((table: string) => query(results[table])),
    } as unknown as SupabaseClient;

    const snapshot = await createSupabaseRepository(client).load();

    expect(snapshot.currently).toMatchObject({
      id: "00000000-0000-0000-0000-000000000301",
      listening_to: null,
      craving: null,
      watching: null,
      thinking_about: null,
    });
  });

  it("creates, updates, and deletes schedules through Supabase", async () => {
    const input = {
      activity_id: demoSnapshot.activities[0].id,
      date: "2026-09-17",
      time: "18:00:00",
      notes: "Matcha date",
    };
    const created = { ...input, id: "schedule-1", created_at: "2026-09-14T00:00:00Z" };
    const updated = { ...created, notes: "Window seat" };

    await expect(createSupabaseRepository(mutationClient({
      table: "schedules", method: "insert", payload: input, result: { data: created, error: null },
    })).createSchedule(input)).resolves.toEqual(created);
    await expect(createSupabaseRepository(mutationClient({
      table: "schedules", method: "update", payload: { notes: "Window seat" }, eq: ["id", "schedule-1"], result: { data: updated, error: null },
    })).updateSchedule("schedule-1", { notes: "Window seat" })).resolves.toEqual(updated);
    await expect(createSupabaseRepository(mutationClient({
      table: "schedules", method: "delete", eq: ["id", "schedule-1"], result: { data: null, error: null },
    })).deleteSchedule("schedule-1")).resolves.toBeUndefined();
  });

  it("updates Dee's answer and creates the singleton Currently row when needed", async () => {
    const question = { ...demoSnapshot.questions[0], answer: "matcha" };
    await expect(createSupabaseRepository(mutationClient({
      table: "dee_questions", method: "update", payload: { answer: "matcha" }, eq: ["id", question.id], result: { data: question, error: null },
    })).updateQuestion(question.id, "  matcha  ")).resolves.toEqual(question);

    const input = {
      listening_to: "NIKI",
      craving: "ramen",
      watching: "F1",
      thinking_about: "the weekend",
    };
    const current = { id: "00000000-0000-0000-0000-000000000301", ...input, updated_at: "2026-09-14T00:00:00Z" };
    await expect(createSupabaseRepository(mutationClient({
      table: "currently", method: "upsert", payload: { id: current.id, ...input }, result: { data: current, error: null },
    })).updateCurrently(input)).resolves.toEqual(current);
  });

  it("passes a Supabase write error back to its caller", async () => {
    const backendError = { code: "42501", message: "row-level security policy rejected the insert" };
    const input = {
      activity_id: demoSnapshot.activities[0].id,
      date: "2026-09-17",
      time: "18:00:00",
      notes: null,
    };
    const repository = createSupabaseRepository(mutationClient({
      table: "schedules", method: "insert", payload: input, result: { data: null, error: backendError },
    }));

    await expect(repository.createSchedule(input)).rejects.toBe(backendError);
  });
});
