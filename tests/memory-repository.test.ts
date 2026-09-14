import { describe, expect, it } from "vitest";
import { createMemoryRepository } from "@/lib/repository/memory";
import { demoSnapshot } from "@/lib/seed";

describe("memory repository", () => {
  it("creates, updates, and deletes schedules", async () => {
    const repository = createMemoryRepository(demoSnapshot);
    const created = await repository.createSchedule({
      activity_id: "activity-matcha",
      date: "2026-09-17",
      time: "18:00:00",
      notes: "Try that new matcha place",
    });

    expect((await repository.load()).schedules).toContainEqual(created);

    const updated = await repository.updateSchedule(created.id, {
      notes: "Meet by the window",
    });
    expect(updated.notes).toBe("Meet by the window");
    expect(updated.date).toBe("2026-09-17");

    await repository.deleteSchedule(created.id);
    expect((await repository.load()).schedules).not.toContainEqual(updated);
  });

  it("updates one question without changing the others", async () => {
    const repository = createMemoryRepository(demoSnapshot);
    const target = demoSnapshot.questions[0];
    const untouched = demoSnapshot.questions[1];

    await repository.updateQuestion(target.id, "matcha");
    const snapshot = await repository.load();

    expect(snapshot.questions.find((item) => item.id === target.id)?.answer).toBe(
      "matcha",
    );
    expect(snapshot.questions.find((item) => item.id === untouched.id)).toEqual(
      untouched,
    );
  });

  it("updates current interests as one record", async () => {
    const repository = createMemoryRepository(demoSnapshot);
    const updated = await repository.updateCurrently({
      listening_to: "NIKI",
      craving: "ramen",
      watching: "F1",
      thinking_about: "the weekend",
    });

    expect(updated).toMatchObject({
      listening_to: "NIKI",
      craving: "ramen",
      watching: "F1",
      thinking_about: "the weekend",
    });
  });
});
