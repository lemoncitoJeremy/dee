"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const snapshotRef = useRef(snapshot);
  const mutationVersions = useRef(new Map<string, number>());
  const [loading, setLoading] = useState(mode === "supabase");
  const [error, setError] = useState<string | null>(null);

  const commitSnapshot = useCallback((update: (current: AppSnapshot) => AppSnapshot) => {
    const next = update(snapshotRef.current);
    snapshotRef.current = next;
    setSnapshot(next);
  }, []);

  const beginMutation = useCallback((key: string) => {
    const version = (mutationVersions.current.get(key) ?? 0) + 1;
    mutationVersions.current.set(key, version);
    return version;
  }, []);

  const isLatestMutation = useCallback(
    (key: string, version: number) => mutationVersions.current.get(key) === version,
    [],
  );

  const failMutation = useCallback((): never => {
    setError("That didn’t save. Your other changes are still here—please try again.");
    throw new Error("Save failed");
  }, []);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await repository.load();
      commitSnapshot(() => loaded);
    } catch {
      setError("We couldn’t load Dee’s little world. Try again?");
    } finally {
      setLoading(false);
    }
  }, [commitSnapshot, repository]);

  useEffect(() => {
    let active = true;
    repository.load().then((loaded) => {
      if (active) commitSnapshot(() => loaded);
    }).catch(() => {
      if (active) setError("We couldn’t load Dee’s little world. Try again?");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [commitSnapshot, repository]);

  const createSchedule = useCallback(
    async (input: ScheduleInput) => {
      const temporary = {
        ...input,
        id: `pending-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setError(null);
      commitSnapshot((current) => ({ ...current, schedules: [...current.schedules, temporary] }));
      try {
        const created = await repository.createSchedule(input);
        commitSnapshot((current) => ({
          ...current,
          schedules: current.schedules.some((item) => item.id === temporary.id)
            ? current.schedules.map((item) => item.id === temporary.id ? created : item)
            : [...current.schedules, created],
        }));
      } catch {
        commitSnapshot((current) => ({
          ...current,
          schedules: current.schedules.filter((item) => item.id !== temporary.id),
        }));
        failMutation();
      }
    },
    [commitSnapshot, failMutation, repository],
  );

  const updateSchedule = useCallback(
    async (id: string, input: ScheduleUpdate) => {
      const key = `schedule:${id}`;
      const version = beginMutation(key);
      const previous = snapshotRef.current.schedules.find((item) => item.id === id);
      setError(null);
      commitSnapshot((current) => ({
        ...current,
        schedules: current.schedules.map((item) => item.id === id ? { ...item, ...input } : item),
      }));
      try {
        const updated = await repository.updateSchedule(id, input);
        if (!isLatestMutation(key, version)) return;
        commitSnapshot((current) => ({
          ...current,
          schedules: current.schedules.map((item) => item.id === id ? updated : item),
        }));
      } catch {
        if (isLatestMutation(key, version) && previous) {
          commitSnapshot((current) => ({
            ...current,
            schedules: current.schedules.some((item) => item.id === id)
              ? current.schedules.map((item) => item.id === id ? previous : item)
              : [...current.schedules, previous],
          }));
        }
        failMutation();
      }
    },
    [beginMutation, commitSnapshot, failMutation, isLatestMutation, repository],
  );

  const deleteSchedule = useCallback(
    async (id: string) => {
      const key = `schedule:${id}`;
      const version = beginMutation(key);
      const previous = snapshotRef.current.schedules.find((item) => item.id === id);
      setError(null);
      commitSnapshot((current) => ({ ...current, schedules: current.schedules.filter((item) => item.id !== id) }));
      try {
        await repository.deleteSchedule(id);
      } catch {
        if (isLatestMutation(key, version) && previous) {
          commitSnapshot((current) => ({ ...current, schedules: [...current.schedules, previous] }));
        }
        failMutation();
      }
    },
    [beginMutation, commitSnapshot, failMutation, isLatestMutation, repository],
  );

  const updateQuestion = useCallback(
    async (id: string, answer: string) => {
      const key = `question:${id}`;
      const version = beginMutation(key);
      const previous = snapshotRef.current.questions.find((item) => item.id === id);
      const now = new Date().toISOString();
      setError(null);
      commitSnapshot((current) => ({
        ...current,
        questions: current.questions.map((item) =>
          item.id === id ? { ...item, answer: answer.trim() || null, updated_at: now } : item,
        ),
      }));
      try {
        const updated = await repository.updateQuestion(id, answer);
        if (!isLatestMutation(key, version)) return;
        commitSnapshot((current) => ({
          ...current,
          questions: current.questions.map((item) => item.id === id ? updated : item),
        }));
      } catch {
        if (isLatestMutation(key, version) && previous) {
          commitSnapshot((current) => ({
            ...current,
            questions: current.questions.map((item) => item.id === id ? previous : item),
          }));
        }
        failMutation();
      }
    },
    [beginMutation, commitSnapshot, failMutation, isLatestMutation, repository],
  );

  const updateCurrently = useCallback(
    async (input: CurrentlyInput) => {
      const key = "currently";
      const version = beginMutation(key);
      const previous = snapshotRef.current.currently;
      setError(null);
      commitSnapshot((current) => ({
        ...current,
        currently: { ...current.currently, ...input, updated_at: new Date().toISOString() },
      }));
      try {
        const updated = await repository.updateCurrently(input);
        if (!isLatestMutation(key, version)) return;
        commitSnapshot((current) => ({ ...current, currently: updated }));
      } catch {
        if (isLatestMutation(key, version)) {
          commitSnapshot((current) => ({ ...current, currently: previous }));
        }
        failMutation();
      }
    },
    [beginMutation, commitSnapshot, failMutation, isLatestMutation, repository],
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
