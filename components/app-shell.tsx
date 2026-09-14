"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Heart, House } from "lucide-react";
import type { Activity } from "@/lib/types";
import { useAppData } from "@/lib/repository/provider";
import { HomeView } from "@/components/home-view";
import { ActivityCalendar } from "@/components/activity-calendar";
import { ScheduleView } from "@/components/schedule-view";
import { DeesWorld } from "@/components/dees-world";

type Tab = "home" | "schedule" | "world";

type NavigationState = {
  started: boolean;
  tab: Tab;
  activityId: string | null;
};

const initialNavigation: NavigationState = {
  started: false,
  tab: "home",
  activityId: null,
};

function isNavigationState(value: unknown): value is NavigationState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NavigationState>;
  return typeof candidate.started === "boolean"
    && ["home", "schedule", "world"].includes(candidate.tab ?? "")
    && (candidate.activityId === null || typeof candidate.activityId === "string");
}

export function AppShell() {
  const { snapshot, mode, loading, error, retry } = useAppData();
  const [navigation, setNavigation] = useState<NavigationState>(initialNavigation);
  const { started, tab, activityId } = navigation;
  const activity = snapshot.activities.find((item) => item.id === activityId) ?? null;

  const navigate = useCallback((next: NavigationState) => {
    if (next.started === navigation.started
      && next.tab === navigation.tab
      && next.activityId === navigation.activityId) return;
    const currentState = window.history.state && typeof window.history.state === "object"
      ? window.history.state
      : {};
    window.history.pushState({ ...currentState, wannaKnowDee: next }, "");
    setNavigation(next);
  }, [navigation]);

  useEffect(() => {
    const currentState = window.history.state && typeof window.history.state === "object"
      ? window.history.state
      : {};
    window.history.replaceState({ ...currentState, wannaKnowDee: initialNavigation }, "");

    const onPopState = (event: PopStateEvent) => {
      const next = (event.state as { wannaKnowDee?: unknown } | null)?.wannaKnowDee;
      if (isNavigationState(next)) setNavigation(next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  if (!started) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-16">
        <div aria-hidden="true" className="doodle doodle-one">♡</div>
        <div aria-hidden="true" className="doodle doodle-two">✦</div>
        <section className="paper-card relative w-full max-w-xl overflow-hidden px-7 py-12 text-center sm:px-12 sm:py-16">
          <div className="mx-auto mb-7 flex h-16 w-16 rotate-[-5deg] items-center justify-center rounded-[22px] border-2 border-plum/10 bg-pink-soft text-3xl shadow-[4px_5px_0_var(--plum)]">💗</div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-berry">made for dee</p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.045em] text-plum sm:text-7xl">wanna know dee</h1>
          <p className="mx-auto mt-6 max-w-sm text-lg leading-relaxed text-plum/65">A little app for getting to know Dee.</p>
          <button onClick={() => navigate({ started: true, tab: "home", activityId: null })} className="mt-9 min-h-12 rounded-full bg-berry px-8 py-3 text-base font-bold text-white shadow-[0_7px_0_var(--berry-dark)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_11px_0_var(--berry-dark)] active:translate-y-1 active:shadow-[0_3px_0_var(--berry-dark)]">Start →</button>
          <p className="mt-8 text-sm text-plum/45">things we can do, when we’ll do them, and a little bit of you</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-main">
      <header className="topbar"><button onClick={() => navigate({ started: true, tab: "home", activityId: null })}><span>💗</span><strong>wanna know dee</strong></button><span className="topbar-note">made with a little crush energy</span></header>
      {mode === "demo" && <div className="demo-banner">✨ Demo mode — everything works, but changes reset when you refresh.</div>}
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => void retry()}>Try again</button></div>}
      {loading ? <div className="loading-card">Opening Dee’s little world…</div> : (
        <div className="page-stage">
          {tab === "home" && (activity ? <ActivityCalendar activity={activity} onBack={() => window.history.back()} /> : <HomeView activities={snapshot.activities} onOpen={(nextActivity: Activity) => navigate({ started: true, tab: "home", activityId: nextActivity.id })} />)}
          {tab === "schedule" && <ScheduleView />}
          {tab === "world" && <DeesWorld />}
        </div>
      )}
      <nav className="bottom-nav" aria-label="Main navigation">
        <button aria-label="Home" className={tab === "home" ? "active" : ""} onClick={() => navigate({ started: true, tab: "home", activityId: null })}><House /><span>Home</span><small>things we can do</small></button>
        <button aria-label="Schedule" className={tab === "schedule" ? "active" : ""} onClick={() => navigate({ started: true, tab: "schedule", activityId: null })}><CalendarDays /><span>Schedule</span><small>when we’re doing them</small></button>
        <button aria-label="Dee's World" className={tab === "world" ? "active" : ""} onClick={() => navigate({ started: true, tab: "world", activityId: null })}><Heart /><span>Dee’s World</span><small>a little bit of Dee</small></button>
      </nav>
    </main>
  );
}
