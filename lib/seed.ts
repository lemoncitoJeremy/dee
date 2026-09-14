import type { AppSnapshot } from "@/lib/types";

const createdAt = "2026-09-14T00:00:00.000Z";

export const demoSnapshot: AppSnapshot = {
  activities: [
    {
      id: "activity-matcha",
      name: "Matcha Girly",
      description: "Feeling low on matcha or probably me?",
      icon: "🍵",
      created_at: createdAt,
    },
    {
      id: "activity-race",
      name: "Race Week",
      description: "It’s race week. You know what that means.",
      icon: "🏎️",
      created_at: createdAt,
    },
    {
      id: "activity-spicy",
      name: "Spicy",
      description: "Feeling a little spicy?",
      icon: "🌶️",
      created_at: createdAt,
    },
    {
      id: "activity-japanese",
      name: "Japanese Food",
      description: "A little sushi wouldn’t hurt, right?",
      icon: "🍣",
      created_at: createdAt,
    },
  ],
  schedules: [],
  questions: [
    ["question-drink", "🍵", "What’s your favorite drink?"],
    ["question-food", "🍜", "What’s your favorite food?"],
    ["question-music", "🎧", "What kind of music do you like?"],
    ["question-movie", "🎬", "What’s a movie or series you love?"],
    ["question-happy", "🌷", "What’s something that always makes you happy?"],
    ["question-travel", "✈️", "Where would you love to travel?"],
    ["question-thinking", "💭", "What’s something you’ve been thinking about lately?"],
  ].map(([id, icon, question]) => ({
    id,
    icon,
    question,
    answer: null,
    created_at: createdAt,
    updated_at: createdAt,
  })),
  currently: {
    id: "currently-dee",
    listening_to: null,
    craving: null,
    watching: null,
    thinking_about: null,
    updated_at: createdAt,
  },
};
