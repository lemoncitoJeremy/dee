# Wanna Know Dee — Design Specification

## Product intent

“wanna know dee” is a small, personal planning app made for Dee. It combines activity ideas, a shared weekly schedule, and a lightweight personal space where Dee can share a few things about herself. The experience should feel like a thoughtful digital scrapbook crossed with a pocket planner: warm, playful, modern, and easy to use.

The first release is intentionally accessible to anyone with the deployed link. It does not include accounts or authentication. Supabase will provide persistence after the project credentials are connected; until then, a clearly identified demo adapter will keep temporary data in memory without using `localStorage`.

## Technology and deployment

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Supabase JavaScript client
- Vercel-compatible deployment
- Mobile-first responsive layout

The application will use environment variables for `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. An example environment file and setup instructions will be included without storing real credentials in the repository.

## Application architecture

The product is a single responsive application with three primary navigation destinations:

1. **Home** — landing state, activity list, and individual activity calendars.
2. **Schedule** — a combined weekly view of schedules from every activity.
3. **Dee’s World** — short editable answers, a random fact, and a compact “Currently…” card.

Bottom navigation remains available throughout the main experience. On mobile it is fixed to the bottom edge; on desktop it becomes a wider centered navigation dock while preserving the same mental model.

UI components are separated by responsibility:

- landing panel and activity card grid;
- activity header and week selector;
- responsive weekly calendar;
- schedule editor and schedule detail dialog;
- combined schedule view;
- question answer editor;
- random Dee fact card;
- “Currently…” editor;
- bottom navigation and shared feedback states.

A repository interface isolates data operations from presentation. It has two implementations:

- **Demo repository:** seeded React memory state for testing the complete interaction flow before credentials exist. Data resets on refresh and is never stored in browser storage.
- **Supabase repository:** persistent reads and writes when both public Supabase environment variables are present.

The interface chooses the repository once at startup. Components use typed operations rather than importing the Supabase client directly.

## Primary journeys

### Landing and activities

The app opens on a small personal landing panel containing:

- “wanna know dee”;
- “A little app for getting to know Dee.”;
- one prominent “Start →” action.

Starting reveals four seeded activity cards:

- 🍵 Matcha Girly — “Feeling low on matcha or probably me?”
- 🏎️ Race Week — “It’s race week. You know what that means.”
- 🌶️ Spicy — “Feeling a little spicy?”
- 🍣 Japanese Food — “A little sushi wouldn’t hurt, right?”

Selecting a card opens its weekly calendar. A back action returns to the activity cards without changing the bottom navigation destination.

### Activity calendar

The activity header carries the activity’s icon, name, and playful description. Week controls provide Previous Week, This Week, and Next Week actions. The default week is the current local week, Monday through Sunday. Past weeks may be viewed with Previous Week so existing data remains reachable; scheduling is optimized for the current and future weeks.

“+ Add Schedule” opens an accessible editor with date, time, and optional notes. Saving immediately inserts the item into the visible week. Selecting an existing item opens a detail dialog with activity, date, time, notes, Edit, and Delete. Deletion requires confirmation.

### Combined schedule

The Schedule tab shows all activity schedules for the selected week. Desktop and tablet widths use a planner grid with weekday columns and hour rows. Events are color-coded by activity and positioned according to their local time.

On narrow mobile screens, the same data uses a grouped daily agenda instead of squeezing an unreadable seven-column grid. Week controls are shared with the activity calendar. Selecting any event opens the same detail dialog and actions.

### Dee’s World

The page begins with “Dee’s World 💗” and “A few things about Dee.” It contains seven optional questions:

- 🍵 What’s your favorite drink?
- 🍜 What’s your favorite food?
- 🎧 What kind of music do you like?
- 🎬 What’s a movie or series you love?
- 🌷 What’s something that always makes you happy?
- ✈️ Where would you love to travel?
- 💭 What’s something you’ve been thinking about lately?

Answers can be edited individually and no answer is required. A Random Dee Fact card draws only from non-empty saved answers. “Another one →” rotates to a different available fact when possible. With no answers, it invites Dee to answer any question.

The “Currently…” card contains four optional fields: Listening to, Craving, Watching, and Thinking about. The card supports editing and saving as one small unit.

## Data model

### `activities`

- `id` UUID primary key
- `name` text, required
- `description` text, required
- `icon` text, required
- `created_at` timestamptz, default now

### `schedules`

- `id` UUID primary key
- `activity_id` UUID foreign key to activities, required
- `date` date, required
- `time` time, required
- `notes` text, optional
- `created_at` timestamptz, default now

### `dee_questions`

- `id` UUID primary key
- `question` text, required
- `answer` text, optional
- `icon` text, required to preserve the requested visual labels
- `created_at` timestamptz, default now
- `updated_at` timestamptz, default now

### `currently`

- `id` UUID primary key
- `listening_to` text, optional
- `craving` text, optional
- `watching` text, optional
- `thinking_about` text, optional
- `updated_at` timestamptz, default now

The SQL setup seeds the four activities, seven questions, and one empty `currently` row. Row-level security policies grant anonymous select, insert, update, and delete access because the initial product is deliberately link-only. The documentation will clearly note that a future authentication layer should replace these permissive policies if the link is shared more broadly.

## State and data flow

Initial data loads once through the active repository. Mutations use optimistic updates so changes appear immediately. When a Supabase request fails, the previous state is restored and a concise retry message is shown. Loading, empty, success, and error states are represented without blocking navigation.

Calendar dates are handled as date-only strings and local times rather than converted UTC timestamps. Week calculations use Monday as the first day and avoid timezone conversion that could move an item to another calendar day. Display formatting targets the user’s browser locale and preserves the stored date and time values.

## Visual direction

The visual thesis is “digital scrapbook meets pocket planner.” The foundation uses a creamy background, dark plum typography, and richer accent colors: berry pink, matcha green, chili red, and soft racing blue. Activity colors remain recognizable in both calendar events and cards.

Cards have generous rounded corners, crisp colored borders or shadows, and restrained paper-like layering. Emoji provide the representational imagery, so no external image assets are necessary. Small heart motifs and hand-drawn-style accents may be implemented as simple non-representational CSS or interface icons. Motion is limited to gentle hover lift, press feedback, dialog transitions, and fact changes, with reduced-motion preferences respected.

Body copy remains at least 16px and regular control labels at least 14px. Touch targets are at least 44px. Focus states are visible, dialogs are keyboard operable, labels are programmatically associated with fields, and color is never the only event identifier.

## Responsive behavior

- **Mobile:** single-column cards, fixed bottom navigation, agenda-style combined schedule, full-width dialogs/sheets with comfortable controls.
- **Tablet:** two-column activity cards and a denser calendar where space permits.
- **Desktop:** centered application shell, four-card activity grid, full weekly time grid, and a floating-width navigation dock.

Content reserves bottom padding so fixed navigation never covers interactive elements. Layouts avoid horizontal scrolling under normal text scaling.

## Failure and empty states

- Demo mode displays a small, non-alarming notice that data resets on refresh until Supabase is connected.
- Failed initial loading offers a retry action.
- Failed mutations restore the previous state and preserve the user’s entered values where possible.
- Empty weeks show an invitation to add a plan.
- Empty Dee answers show prompts without treating incomplete fields as errors.
- The Random Dee Fact card explains that a fact will appear after at least one answer is saved.

## Verification

Verification will include a production build and focused interaction checks for:

- landing and Start transition;
- bottom navigation;
- opening each activity and switching weeks;
- adding, editing, and deleting schedules;
- combined weekly grid and mobile agenda behavior;
- schedule detail presentation;
- editing optional Dee answers;
- random fact rotation with zero, one, and multiple answers;
- updating the “Currently…” card;
- demo/Supabase adapter selection;
- responsive layout and keyboard-visible focus states.

## Out of scope

The first release does not include authentication, mood tracking, long questionnaires, gift tracking, detailed profiles, uploads, notifications, sharing workflows, recurring schedules, or administrative tools. These can be added later without changing the initial navigation or repository boundary.
