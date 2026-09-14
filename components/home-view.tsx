import { ArrowUpRight } from "lucide-react";
import type { Activity } from "@/lib/types";

const colors = ["matcha", "racing", "chili", "sushi"];

export function HomeView({
  activities,
  onOpen,
}: {
  activities: Activity[];
  onOpen: (activity: Activity) => void;
}) {
  return (
    <section className="content-wrap">
      <header className="page-heading">
        <p className="eyebrow">pick a little plan</p>
        <h1>What are we feeling?</h1>
        <p>Choose one and let’s find a day for it.</p>
      </header>
      <div className="activity-grid">
        {activities.map((activity, index) => (
          <button
            key={activity.id}
            onClick={() => onOpen(activity)}
            className={`activity-card activity-${colors[index % colors.length]}`}
            aria-label={`${activity.name}. ${activity.description}`}
          >
            <span className="activity-icon">{activity.icon}</span>
            <span>
              <strong>{activity.name}</strong>
              <small>{activity.description}</small>
            </span>
            <ArrowUpRight className="activity-arrow" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
