import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppDataProvider, useAppData } from "@/lib/repository/provider";
import { demoSnapshot } from "@/lib/seed";
import type { AppRepository, DeeQuestion, Schedule } from "@/lib/types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("AppDataProvider", () => {
  it("preserves both answers when concurrent saves resolve out of order", async () => {
    const first = deferred<DeeQuestion>();
    const second = deferred<DeeQuestion>();
    const repository: AppRepository = {
      load: vi.fn(async () => structuredClone(demoSnapshot)),
      createSchedule: vi.fn(),
      updateSchedule: vi.fn(),
      deleteSchedule: vi.fn(),
      updateQuestion: vi.fn((id) => id.endsWith("201") ? first.promise : second.promise),
      updateCurrently: vi.fn(),
    };
    let actions: ReturnType<typeof useAppData> | undefined;
    function Harness() {
      actions = useAppData();
      return <div>{actions.snapshot.questions.map((item) => `${item.id}:${item.answer ?? ""}`).join("|")}</div>;
    }
    render(<AppDataProvider repositoryOverride={repository}><Harness /></AppDataProvider>);
    await waitFor(() => expect(repository.load).toHaveBeenCalled());

    let firstSave!: Promise<void>;
    let secondSave!: Promise<void>;
    act(() => {
      firstSave = actions!.updateQuestion("00000000-0000-0000-0000-000000000201", "matcha");
      secondSave = actions!.updateQuestion("00000000-0000-0000-0000-000000000202", "ramen");
    });
    second.resolve({ ...demoSnapshot.questions[1], answer: "ramen", updated_at: "second" });
    await act(async () => { await secondSave; });
    first.resolve({ ...demoSnapshot.questions[0], answer: "matcha", updated_at: "first" });
    await act(async () => { await firstSave; });

    expect(screen.getByText(/201:matcha/)).toBeVisible();
    expect(screen.getByText(/202:ramen/)).toBeVisible();
  });

  it("does not erase a concurrent create when another mutation fails", async () => {
    const created = deferred<Schedule>();
    const repository: AppRepository = {
      load: vi.fn(async () => structuredClone(demoSnapshot)),
      createSchedule: vi.fn(() => created.promise),
      updateSchedule: vi.fn(),
      deleteSchedule: vi.fn(),
      updateQuestion: vi.fn(async () => { throw new Error("offline"); }),
      updateCurrently: vi.fn(),
    };
    let actions: ReturnType<typeof useAppData> | undefined;
    function Harness() {
      actions = useAppData();
      return <div>{actions.snapshot.schedules.map((item) => item.notes).join("|")}</div>;
    }
    render(<AppDataProvider repositoryOverride={repository}><Harness /></AppDataProvider>);
    await waitFor(() => expect(repository.load).toHaveBeenCalled());

    let createPromise!: Promise<void>;
    act(() => {
      createPromise = actions!.createSchedule({
        activity_id: demoSnapshot.activities[0].id,
        date: "2026-09-17",
        time: "18:00:00",
        notes: "still here",
      });
    });
    await expect(actions!.updateQuestion(demoSnapshot.questions[0].id, "matcha")).rejects.toThrow("offline");
    created.resolve({
      id: "created",
      activity_id: demoSnapshot.activities[0].id,
      date: "2026-09-17",
      time: "18:00:00",
      notes: "still here",
      created_at: "now",
    });
    await act(async () => { await createPromise; });

    expect(screen.getByText("still here")).toBeVisible();
  });

  it("preserves the backend error for callers and shows it in the banner", async () => {
    const backendError = new Error("new row violates row-level security policy");
    const repository: AppRepository = {
      load: vi.fn(async () => structuredClone(demoSnapshot)),
      createSchedule: vi.fn(async () => { throw backendError; }),
      updateSchedule: vi.fn(),
      deleteSchedule: vi.fn(),
      updateQuestion: vi.fn(),
      updateCurrently: vi.fn(),
    };
    let actions: ReturnType<typeof useAppData> | undefined;
    function Harness() {
      actions = useAppData();
      return actions.error ? <div role="alert">{actions.error}</div> : null;
    }
    render(<AppDataProvider repositoryOverride={repository}><Harness /></AppDataProvider>);
    await waitFor(() => expect(repository.load).toHaveBeenCalled());

    const save = actions!.createSchedule({
      activity_id: demoSnapshot.activities[0].id,
      date: "2026-09-17",
      time: "18:00:00",
      notes: null,
    });

    await expect(save).rejects.toBe(backendError);
    expect(await screen.findByRole("alert")).toHaveTextContent(/row-level security policy/i);
  });
});
