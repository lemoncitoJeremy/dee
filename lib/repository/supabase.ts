import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  Activity,
  AppRepository,
  Currently,
  CurrentlyInput,
  DeeQuestion,
  Schedule,
  ScheduleInput,
  ScheduleUpdate,
} from "@/lib/types";

function requireData<T>(data: T | null, message: string): T {
  if (!data) throw new Error(message);
  return data;
}

export function createSupabaseRepository(): AppRepository {
  const client = createBrowserSupabaseClient();

  return {
    async load() {
      const [activities, schedules, questions, current] = await Promise.all([
        client.from("activities").select("*").order("created_at"),
        client.from("schedules").select("*").order("date").order("time"),
        client.from("dee_questions").select("*").order("created_at"),
        client.from("currently").select("*").limit(1).single(),
      ]);
      const error =
        activities.error ?? schedules.error ?? questions.error ?? current.error;
      if (error) throw error;
      return {
        activities: activities.data as Activity[],
        schedules: schedules.data as Schedule[],
        questions: questions.data as DeeQuestion[],
        currently: current.data as Currently,
      };
    },
    async createSchedule(input: ScheduleInput) {
      const { data, error } = await client
        .from("schedules")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return requireData(data as Schedule | null, "Schedule was not created.");
    },
    async updateSchedule(id: string, input: ScheduleUpdate) {
      const { data, error } = await client
        .from("schedules")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return requireData(data as Schedule | null, "Schedule was not updated.");
    },
    async deleteSchedule(id: string) {
      const { error } = await client.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    async updateQuestion(id: string, answer: string) {
      const { data, error } = await client
        .from("dee_questions")
        .update({ answer: answer.trim() || null })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return requireData(data as DeeQuestion | null, "Answer was not saved.");
    },
    async updateCurrently(input: CurrentlyInput) {
      const { data, error } = await client
        .from("currently")
        .update(input)
        .eq("id", "00000000-0000-0000-0000-000000000301")
        .select()
        .single();
      if (error) throw error;
      return requireData(data as Currently | null, "Currently was not saved.");
    },
  };
}
