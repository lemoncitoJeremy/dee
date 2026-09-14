"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createMemoryRepository } from "@/lib/repository/memory";
import { createSupabaseRepository } from "@/lib/repository/supabase";
import { demoSnapshot } from "@/lib/seed";
import { hasSupabaseEnvironment } from "@/lib/supabase/client";
import type {
  AppSnapshot,
  CurrentlyInput,
  ScheduleInput,
  ScheduleUpdate,
} from "@/lib/types";

type AppDataValue = {
  snapshot: AppSnapshot;
  mode: "demo" | "supabase";
  loading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  createSchedule: (input: ScheduleInput) => Promise<void>;
  updateSchedule: (id: string, input: ScheduleUpdate) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  updateQuestion: (id: string, answer: string) => Promise<void>;
  updateCurrently: (input: CurrentlyInput) => Promise<void>;
};

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const mode = hasSupabaseEnvironment() ? "supabase" : "demo";
  const repository = useMemo(
    () =>
      mode === "supabase"
        ? createSupabaseRepository()
        : createMemoryRepository(demoSnapshot),
    [mode],
  );
  const [snapshot, setSnapshot] = useState<AppSnapshot>(demoSnapshot);
  const [loading, setLoading] = useState(mode === "supabase");
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSnapshot(await repository.load());
    } catch {
      setError("We couldn’t load Dee’s little world. Try again?");
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    void retry();
  }, [retry]);

  const withRollback = useCallback(
    async (optimistic: AppSnapshot, operation: () => Promise<AppSnapshot>) => {
      const previous = snapshot;
      setSnapshot(optimistic);
      setError(null);
      try {
        setSnapshot(await operation());
      } catch {
        setSnapshot(previous);
        setError("That didn’t save. Your last version is still here—please try again.");
        throw new Error("Save failed");
      }
    },
    [snapshot],
  );

  const createSchedule = useCallback(
    async (input: ScheduleInput) => {
      const temporary = {
        ...input,
        id: `pending-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      await withRollback(
        { ...snapshot, schedules: [...snapshot.schedules, temporary] },
        async () => {
          const created = await repository.createSchedule(input);
          return { ...snapshot, schedules: [...snapshot.schedules, created] };
        },
      );
    },
    [repository, snapshot, withRollback],
  );

  const updateSchedule = useCallback(
    async (id: string, input: ScheduleUpdate) => {
      const optimistic = {
        ...snapshot,
        schedules: snapshot.schedules.map((item) =>
          item.id === id ? { ...item, ...input } : item,
        ),
      };
      await withRollback(optimistic, async () => {
        const updated = await repository.updateSchedule(id, input);
        return {
          ...snapshot,
          schedules: snapshot.schedules.map((item) =>
            item.id === id ? updated : item,
          ),
        };
      });
    },
    [repository, snapshot, withRollback],
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      const next = {
        ...snapshot,
        schedules: snapshot.schedules.filter((item) => item.id !== id),
      };
      await withRollback(next, async () => {
        await repository.deleteSchedule(id);
        return next;
      });
    },
    [repository, snapshot, withRollback],
  );

  const updateQuestion = useCallback(
    async (id: string, answer: string) => {
      const now = new Date().toISOString();
      const optimistic = {
        ...snapshot,
        questions: snapshot.questions.map((item) =>
          item.id === id ? { ...item, answer: answer.trim() || null, updated_at: now } : item,
        ),
      };
      await withRollback(optimistic, async () => {
        const updated = await repository.updateQuestion(id, answer);
        return {
          ...snapshot,
          questions: snapshot.questions.map((item) =>
            item.id === id ? updated : item,
          ),
        };
      });
    },
    [repository, snapshot, withRollback],
  );

  const updateCurrently = useCallback(
    async (input: CurrentlyInput) => {
      const optimistic = {
        ...snapshot,
        currently: { ...snapshot.currently, ...input, updated_at: new Date().toISOString() },
      };
      await withRollback(optimistic, async () => ({
        ...snapshot,
        currently: await repository.updateCurrently(input),
      }));
    },
    [repository, snapshot, withRollback],
  );

  return (
    <AppDataContext.Provider
      value={{
        snapshot,
        mode,
        loading,
        error,
        retry,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        updateQuestion,
        updateCurrently,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData must be used inside AppDataProvider.");
  return value;
}
