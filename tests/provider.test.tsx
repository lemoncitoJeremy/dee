import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppDataProvider, useAppData } from "@/lib/repository/provider";
import { demoSnapshot } from "@/lib/seed";
import type { AppRepository, DeeQuestion } from "@/lib/types";

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
});
