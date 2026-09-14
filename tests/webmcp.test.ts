import { describe, expect, it, vi } from "vitest";
import { registerAppTools, type RegisteredTool } from "@/lib/webmcp";

describe("WebMCP tools", () => {
  it("registers the app's five real journeys", () => {
    const tools: RegisteredTool[] = [];
    const context = { registerTool: (tool: RegisteredTool) => tools.push(tool) };

    registerAppTools(context, {
      listActivities: () => [],
      listSchedules: () => [],
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
      { registerTool: (tool: RegisteredTool) => tools.push(tool) },
      {
        listActivities: () => [],
        listSchedules: () => [],
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
});
