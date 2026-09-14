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
  AppRepository,
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

export function AppDataProvider({ children, repositoryOverride }: { children: ReactNode; repositoryOverride?: AppRepository }) {
  const mode = hasSupabaseEnvironment() ? "supabase" : "demo";
  const repository = useMemo(
    () =>
      repositoryOverride ?? (mode === "supabase"
        ? createSupabaseRepository()
        : createMemoryRepository(demoSnapshot)),
    [mode, repositoryOverride],
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
    let active = true;
    repository.load().then((loaded) => {
      if (active) setSnapshot(loaded);
    }).catch(() => {
      if (active) setError("We couldn’t load Dee’s little world. Try again?");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [repository]);

  const recoverFromFailure = useCallback(async () => {
    try {
      setSnapshot(await repository.load());
    } catch {
      // Keep the latest optimistic UI if the authoritative reload also fails.
    }
    setError("That didn’t save. Please try again.");
    throw new Error("Save failed");
  }, [repository]);

  const createSchedule = useCallback(
    async (input: ScheduleInput) => {
      const temporary = {
        ...input,
        id: `pending-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setError(null);
      setSnapshot((current) => ({ ...current, schedules: [...current.schedules, temporary] }));
      try {
        const created = await repository.createSchedule(input);
        setSnapshot((current) => ({
          ...current,
          schedules: current.schedules.map((item) => item.id === temporary.id ? created : item),
        }));
      } catch {
        await recoverFromFailure();
      }
    },
    [recoverFromFailure, repository],
  );

  const updateSchedule = useCallback(
    async (id: string, input: ScheduleUpdate) => {
      setError(null);
      setSnapshot((current) => ({
        ...current,
        schedules: current.schedules.map((item) => item.id === id ? { ...item, ...input } : item),
      }));
      try {
        const updated = await repository.updateSchedule(id, input);
        setSnapshot((current) => ({
          ...current,
          schedules: current.schedules.map((item) => item.id === id ? updated : item),
        }));
      } catch {
        await recoverFromFailure();
      }
    },
    [recoverFromFailure, repository],
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      setError(null);
      setSnapshot((current) => ({ ...current, schedules: current.schedules.filter((item) => item.id !== id) }));
      try {
        await repository.deleteSchedule(id);
      } catch {
        await recoverFromFailure();
      }
    },
    [recoverFromFailure, repository],
  );

  const updateQuestion = useCallback(
    async (id: string, answer: string) => {
      const now = new Date().toISOString();
      setError(null);
      setSnapshot((current) => ({
        ...current,
        questions: current.questions.map((item) =>
          item.id === id ? { ...item, answer: answer.trim() || null, updated_at: now } : item,
        ),
      }));
      try {
        const updated = await repository.updateQuestion(id, answer);
        setSnapshot((current) => ({
          ...current,
          questions: current.questions.map((item) => item.id === id ? updated : item),
        }));
      } catch {
        await recoverFromFailure();
      }
    },
    [recoverFromFailure, repository],
  );

  const updateCurrently = useCallback(
    async (input: CurrentlyInput) => {
      setError(null);
      setSnapshot((current) => ({
        ...current,
        currently: { ...current.currently, ...input, updated_at: new Date().toISOString() },
      }));
      try {
        const updated = await repository.updateCurrently(input);
        setSnapshot((current) => ({ ...current, currently: updated }));
      } catch {
        await recoverFromFailure();
      }
    },
    [recoverFromFailure, repository],
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
