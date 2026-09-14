"use client";

import { useState } from "react";
import { CalendarDays, Heart, House } from "lucide-react";
import type { Activity } from "@/lib/types";
import { useAppData } from "@/lib/repository/provider";
import { HomeView } from "@/components/home-view";
import { ActivityCalendar } from "@/components/activity-calendar";
import { ScheduleView } from "@/components/schedule-view";
import { DeesWorld } from "@/components/dees-world";

type Tab = "home" | "schedule" | "world";

export function AppShell() {
  const { snapshot, mode, loading, error, retry } = useAppData();
  const [started, setStarted] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [activity, setActivity] = useState<Activity | null>(null);

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
          <button onClick={() => setStarted(true)} className="mt-9 min-h-12 rounded-full bg-berry px-8 py-3 text-base font-bold text-white shadow-[0_7px_0_var(--berry-dark)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_11px_0_var(--berry-dark)] active:translate-y-1 active:shadow-[0_3px_0_var(--berry-dark)]">Start →</button>
          <p className="mt-8 text-sm text-plum/45">things we can do, when we’ll do them, and a little bit of you</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-main">
      <header className="topbar"><button onClick={() => { setTab("home"); setActivity(null); }}><span>💗</span><strong>wanna know dee</strong></button><span className="topbar-note">made with a little crush energy</span></header>
      {mode === "demo" && <div className="demo-banner">✨ Demo mode — everything works, but changes reset when you refresh.</div>}
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => void retry()}>Try again</button></div>}
      {loading ? <div className="loading-card">Opening Dee’s little world…</div> : (
        <div className="page-stage">
          {tab === "home" && (activity ? <ActivityCalendar activity={activity} onBack={() => setActivity(null)} /> : <HomeView activities={snapshot.activities} onOpen={setActivity} />)}
          {tab === "schedule" && <ScheduleView />}
          {tab === "world" && <DeesWorld />}
        </div>
      )}
      <nav className="bottom-nav" aria-label="Main navigation">
        <button aria-label="Home" className={tab === "home" ? "active" : ""} onClick={() => { setTab("home"); setActivity(null); }}><House /><span>Home</span><small>things we can do</small></button>
        <button aria-label="Schedule" className={tab === "schedule" ? "active" : ""} onClick={() => setTab("schedule")}><CalendarDays /><span>Schedule</span><small>when we’re doing them</small></button>
        <button aria-label="Dee's World" className={tab === "world" ? "active" : ""} onClick={() => setTab("world")}><Heart /><span>Dee’s World</span><small>a little bit of Dee</small></button>
      </nav>
    </main>
  );
}
