"use client";

import { useEffect } from "react";
import { useAppData } from "@/lib/repository/provider";
import { registerAppTools, type RegisteredTool } from "@/lib/webmcp";

type WebMcpDocument = Document & {
  modelContext?: {
    registerTool: (
      tool: RegisteredTool,
      options?: { signal?: AbortSignal },
    ) => void | Promise<void>;
  };
};

export function WebMcpTools() {
  const { snapshot, createSchedule, updateQuestion, updateCurrently } = useAppData();

  useEffect(() => {
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    registerAppTools(
      context,
      {
        listActivities: () => snapshot.activities,
        listSchedules: () => snapshot.schedules,
        addSchedule: createSchedule,
        updateQuestion,
        updateCurrently,
      },
      lifecycle.signal,
    );
    return () => lifecycle.abort();
  }, [createSchedule, snapshot.activities, snapshot.schedules, updateCurrently, updateQuestion]);

  return null;
}
