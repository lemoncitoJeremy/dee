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
    void registerAppTools(
      context,
      {
        listActivities: () => snapshot.activities,
        listSchedules: () => snapshot.schedules,
        listQuestions: () => snapshot.questions,
        addSchedule: createSchedule,
        updateQuestion,
        updateCurrently,
      },
      lifecycle.signal,
    ).catch((error) => {
      console.error("Unable to register Wanna Know Dee tools.", error);
    });
    return () => lifecycle.abort();
  }, [createSchedule, snapshot.activities, snapshot.questions, snapshot.schedules, updateCurrently, updateQuestion]);

  return null;
}
