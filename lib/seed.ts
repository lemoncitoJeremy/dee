import type { AppSnapshot } from "@/lib/types";

const createdAt = "2026-09-14T00:00:00.000Z";

export const demoSnapshot: AppSnapshot = {
  activities: [
    {
      id: "00000000-0000-0000-0000-000000000101",
      name: "Matcha Girly",
      description: "Feeling low on matcha or probably me?",
      icon: "🍵",
      created_at: createdAt,
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      name: "Race Week",
      description: "It’s race week. You know what that means.",
      icon: "🏎️",
      created_at: createdAt,
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      name: "Spicy",
      description: "Feeling a little spicy?",
      icon: "🌶️",
      created_at: createdAt,
    },
    {
      id: "00000000-0000-0000-0000-000000000104",
      name: "Japanese Food",
      description: "A little sushi wouldn’t hurt, right?",
      icon: "🍣",
      created_at: createdAt,
    },
  ],
  schedules: [],
  questions: [
    ["00000000-0000-0000-0000-000000000201", "🍵", "What’s your favorite drink?"],
    ["00000000-0000-0000-0000-000000000202", "🍜", "What’s your favorite food?"],
    ["00000000-0000-0000-0000-000000000203", "🎧", "What kind of music do you like?"],
    ["00000000-0000-0000-0000-000000000204", "🎬", "What’s a movie or series you love?"],
    ["00000000-0000-0000-0000-000000000205", "🌷", "What’s something that always makes you happy?"],
    ["00000000-0000-0000-0000-000000000206", "✈️", "Where would you love to travel?"],
    ["00000000-0000-0000-0000-000000000207", "💭", "What’s something you’ve been thinking about lately?"],
  ].map(([id, icon, question]) => ({
    id,
    icon,
    question,
    answer: null,
    created_at: createdAt,
    updated_at: createdAt,
  })),
  currently: {
    id: "00000000-0000-0000-0000-000000000301",
    listening_to: null,
    craving: null,
    watching: null,
    thinking_about: null,
    updated_at: createdAt,
  },
};
