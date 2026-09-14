import { describe, expect, it, vi } from "vitest";
import { registerAppTools, type RegisteredTool } from "@/lib/webmcp";

describe("WebMCP tools", () => {
  it("registers the app's five real journeys", () => {
    const tools: RegisteredTool[] = [];
    const context = {
      registerTool: (tool: RegisteredTool) => {
        tools.push(tool);
      },
    };

    registerAppTools(context, {
      listActivities: () => [],
      listSchedules: () => [],
      listQuestions: () => [],
      addSchedule: vi.fn(),
      updateQuestion: vi.fn(),
      updateCurrently: vi.fn(),
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "list_activities",
      "list_schedules",
      "add_schedule",
      "update_dee_answer",
      "update_dee_currently",
    ]);
  });

  it("rejects malformed schedules before changing app state", async () => {
    const tools: RegisteredTool[] = [];
    const addSchedule = vi.fn();
    registerAppTools(
      {
        registerTool: (tool: RegisteredTool) => {
          tools.push(tool);
        },
      },
      {
        listActivities: () => [],
        listSchedules: () => [],
        listQuestions: () => [],
        addSchedule,
        updateQuestion: vi.fn(),
        updateCurrently: vi.fn(),
      },
    );

    const tool = tools.find((item) => item.name === "add_schedule");
    await expect(
      tool?.execute({ activity_id: "matcha", date: "tomorrow", time: "6pm" }),
    ).rejects.toThrow("YYYY-MM-DD");
    expect(addSchedule).not.toHaveBeenCalled();
  });

  it("rejects impossible dates, times, and unknown activities", async () => {
    const tools: RegisteredTool[] = [];
    const addSchedule = vi.fn();
    await registerAppTools(
      { registerTool: (tool) => { tools.push(tool); } },
      {
        listActivities: () => [{ id: "known", name: "Matcha", description: "", icon: "🍵", created_at: "" }],
        listSchedules: () => [],
        listQuestions: () => [],
        addSchedule,
        updateQuestion: vi.fn(),
        updateCurrently: vi.fn(),
      },
    );
    const tool = tools.find((item) => item.name === "add_schedule");

    await expect(tool?.execute({ activity_id: "known", date: "2026-02-31", time: "18:00" })).rejects.toThrow("valid calendar date");
    await expect(tool?.execute({ activity_id: "known", date: "2026-09-17", time: "29:75" })).rejects.toThrow("valid 24-hour time");
    await expect(tool?.execute({ activity_id: "missing", date: "2026-09-17", time: "18:00" })).rejects.toThrow("activity_id");
    expect(addSchedule).not.toHaveBeenCalled();
  });

  it("requires a complete Currently update so omitted fields are not cleared", async () => {
    const tools: RegisteredTool[] = [];
    const updateCurrently = vi.fn();
    await registerAppTools(
      { registerTool: (tool) => { tools.push(tool); } },
      {
        listActivities: () => [],
        listSchedules: () => [],
        listQuestions: () => [],
        addSchedule: vi.fn(),
        updateQuestion: vi.fn(),
        updateCurrently,
      },
    );
    const tool = tools.find((item) => item.name === "update_dee_currently");

    await expect(tool?.execute({ listening_to: "NIKI" })).rejects.toThrow("all four");
    expect(updateCurrently).not.toHaveBeenCalled();
  });

  it("ignores expected registration aborts during React cleanup", async () => {
    const context = {
      registerTool: () => Promise.reject(new DOMException("Cancelled", "AbortError")),
    };

    await expect(
      registerAppTools(context, {
        listActivities: () => [],
        listSchedules: () => [],
        listQuestions: () => [],
        addSchedule: vi.fn(),
        updateQuestion: vi.fn(),
        updateCurrently: vi.fn(),
      }),
    ).resolves.toBeUndefined();
  });
});
