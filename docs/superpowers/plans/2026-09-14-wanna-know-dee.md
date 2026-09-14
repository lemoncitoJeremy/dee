# Wanna Know Dee Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, responsive, Vercel-ready “wanna know dee” app with activity scheduling, a combined weekly calendar, Dee’s editable personal space, and a Supabase-ready persistence layer.

**Architecture:** A single Next.js App Router page owns the primary navigation and consumes a typed repository through a React provider. The provider selects an in-memory demo repository when Supabase public environment variables are absent and a Supabase repository when they are present. Calendar utilities and data operations remain independent of presentation components so week logic and persistence can be tested directly.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Supabase JavaScript client, Lucide React, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-09-14-wanna-know-dee-design.md`

## Global Constraints

- The app is accessible to anyone with its link and has no authentication in the first release.
- Use Supabase for persistent data; demo mode may use React memory state but must never use `localStorage`.
- Store calendar dates as `YYYY-MM-DD` and times as `HH:mm:ss` without UTC conversion.
- Treat Monday as the first day of each displayed week.
- Preserve all supplied activity names, descriptions, icons, questions, and primary interface copy.
- Keep Dee’s World intentionally small; do not add mood tracking, profiles, uploads, notifications, or questionnaires.
- Build mobile-first with a fixed bottom navigation and a readable mobile agenda alternative to the desktop time grid.
- Keep body text at least 16px, routine labels at least 14px, and touch targets at least 44px.
- Include a site-specific favicon and Vercel/Supabase setup documentation.

---

## Planned file structure

- `app/layout.tsx` — metadata, fonts, and document shell.
- `app/page.tsx` — application entry point and data provider composition.
- `app/globals.css` — Tailwind import, design tokens, global layout, and motion preferences.
- `app/icon.svg` — compact heart/calendar favicon.
- `components/app-shell.tsx` — landing state, primary view state, bottom navigation, and activity drill-in.
- `components/home-view.tsx` — activity card collection.
- `components/activity-calendar.tsx` — one activity’s weekly schedule experience.
- `components/schedule-view.tsx` — combined desktop grid and mobile agenda.
- `components/week-switcher.tsx` — shared week navigation.
- `components/schedule-dialog.tsx` — create/edit/detail behavior and deletion confirmation.
- `components/dees-world.tsx` — questions, random fact, and currently card.
- `components/ui/*` — installed dialog, alert-dialog, button, input, label, textarea, and toast primitives used by feature components.
- `lib/types.ts` — shared entities and repository contract.
- `lib/seed.ts` — demo activities, questions, schedules, and current values.
- `lib/calendar.ts` — date parsing, week boundaries, formatting, and event grouping.
- `lib/repository/memory.ts` — in-memory repository.
- `lib/repository/supabase.ts` — Supabase repository.
- `lib/repository/provider.tsx` — repository selection, loading, optimistic state, rollback, and actions.
- `lib/supabase/client.ts` — browser client construction and environment detection.
- `supabase/schema.sql` — schema, triggers, seeds, indexes, and public row-level policies.
- `.env.example` — public Supabase environment variable names.
- `README.md` — local setup, Supabase connection, and Vercel deployment steps.
- `tests/calendar.test.ts` — week and grouping behavior.
- `tests/memory-repository.test.ts` — repository CRUD behavior.
- `tests/app.test.tsx` — primary user journeys.
- `vitest.config.ts`, `vitest.setup.ts` — browser-like test configuration.

---

### Task 1: Scaffold the application and establish the visual foundation

**Files:**
- Create: `package.json`, framework configuration, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/icon.svg`
- Create: `vitest.config.ts`, `vitest.setup.ts`, `tests/app.test.tsx`

**Interfaces:**
- Consumes: none
- Produces: the Next.js application shell and a `HomePage` route that renders the branded landing content

- [ ] **Step 1: Initialize the supported Next.js/Tailwind starter and preserve its package manager and lockfile**

Run the Sites portable project setup flow in the empty workspace, then inspect only the generated package scripts, page, layout, global stylesheet, and installed UI primitives.

- [ ] **Step 2: Configure Vitest and write the first failing landing test**

```tsx
it("starts with the personal landing panel", () => {
  render(<Home />)
  expect(screen.getByRole("heading", { name: /wanna know dee/i })).toBeVisible()
  expect(screen.getByText("A little app for getting to know Dee.")).toBeVisible()
  expect(screen.getByRole("button", { name: /start/i })).toBeVisible()
})
```

- [ ] **Step 3: Run the landing test and confirm it fails before product code exists**

Run: `npm test -- --run tests/app.test.tsx`

Expected: FAIL because the requested page content has not been implemented.

- [ ] **Step 4: Implement the metadata, visual tokens, landing panel, responsive root layout, and favicon**

Use a cream canvas, plum text, berry primary action, and activity accent tokens. Include visible keyboard focus, reduced-motion handling, bottom-safe-area spacing, and a small heart/calendar SVG favicon.

- [ ] **Step 5: Run the focused test and production build**

Run: `npm test -- --run tests/app.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: successful production build with the root route generated.

- [ ] **Step 6: Commit the foundation**

```bash
git add package.json package-lock.json app tests/app.test.tsx vitest.config.ts vitest.setup.ts
git commit -m "feat: create wanna know dee foundation"
```

### Task 2: Implement calendar domain logic and repository adapters

**Files:**
- Create: `lib/types.ts`, `lib/seed.ts`, `lib/calendar.ts`
- Create: `lib/repository/memory.ts`, `lib/repository/supabase.ts`, `lib/supabase/client.ts`
- Create: `tests/calendar.test.ts`, `tests/memory-repository.test.ts`

**Interfaces:**
- Produces: `Activity`, `Schedule`, `DeeQuestion`, `Currently`, `AppSnapshot`, `ScheduleInput`, and `AppRepository`
- Produces: `startOfWeek(date: Date): Date`, `weekDays(anchor: Date): Date[]`, `dateKey(date: Date): string`, `groupSchedulesByDate(schedules: Schedule[]): Map<string, Schedule[]>`
- Produces: `createMemoryRepository(seed?: AppSnapshot): AppRepository`, `createSupabaseRepository(): AppRepository`, `hasSupabaseEnvironment(): boolean`

- [ ] **Step 1: Write failing week-boundary and grouping tests**

```ts
expect(dateKey(startOfWeek(new Date(2026, 8, 17)))).toBe("2026-09-14")
expect(weekDays(new Date(2026, 8, 17)).map(dateKey)).toHaveLength(7)
expect(groupSchedulesByDate(schedules).get("2026-09-17")?.[0]?.time).toBe("18:00:00")
```

- [ ] **Step 2: Write failing in-memory CRUD tests**

Verify `load`, `createSchedule`, `updateSchedule`, `deleteSchedule`, `updateQuestion`, and `updateCurrently`, including preservation of untouched fields.

- [ ] **Step 3: Run domain tests and confirm failures**

Run: `npm test -- --run tests/calendar.test.ts tests/memory-repository.test.ts`

Expected: FAIL because the domain modules do not exist.

- [ ] **Step 4: Implement shared types, exact seed content, and calendar functions**

Define the repository contract with promise-returning CRUD operations. Use local `Date` construction from date components and never parse date-only values with `new Date("YYYY-MM-DD")`.

- [ ] **Step 5: Implement both repositories and environment selection**

The memory repository clones its state and returns fresh snapshots. The Supabase repository queries `activities`, `schedules`, `dee_questions`, and the single `currently` row, returns typed results, and throws actionable errors for the provider to handle.

- [ ] **Step 6: Run tests and commit**

Run: `npm test -- --run tests/calendar.test.ts tests/memory-repository.test.ts`

Expected: PASS.

```bash
git add lib tests/calendar.test.ts tests/memory-repository.test.ts
git commit -m "feat: add scheduling data layer"
```

### Task 3: Build activity scheduling and the combined calendar

**Files:**
- Create: `lib/repository/provider.tsx`
- Create: `components/app-shell.tsx`, `components/home-view.tsx`, `components/activity-calendar.tsx`
- Create: `components/week-switcher.tsx`, `components/schedule-view.tsx`, `components/schedule-dialog.tsx`
- Modify: `app/page.tsx`, `tests/app.test.tsx`

**Interfaces:**
- Consumes: `AppRepository`, calendar utilities, and domain entities from Task 2
- Produces: `AppDataProvider`, `useAppData`, and the complete Home/Schedule interaction flow

- [ ] **Step 1: Add failing activity and scheduling journey tests**

```tsx
await user.click(screen.getByRole("button", { name: /start/i }))
expect(screen.getByRole("button", { name: /matcha girly/i })).toBeVisible()
await user.click(screen.getByRole("button", { name: /matcha girly/i }))
await user.click(screen.getByRole("button", { name: /add schedule/i }))
await user.type(screen.getByLabelText(/notes/i), "Try that new matcha place")
await user.click(screen.getByRole("button", { name: /save schedule/i }))
expect(screen.getByText("Try that new matcha place")).toBeVisible()
```

Add cases for edit, delete confirmation, week navigation, activity filtering, combined schedule navigation, and schedule details.

- [ ] **Step 2: Run the focused UI tests and confirm failures**

Run: `npm test -- --run tests/app.test.tsx`

Expected: FAIL because scheduling components do not exist.

- [ ] **Step 3: Implement provider loading and optimistic mutations**

Expose `snapshot`, `mode`, `loading`, `error`, `retry`, schedule CRUD, question update, and currently update. For each mutation, save the previous snapshot, update immediately, await the repository, and restore the prior snapshot with a retryable message on failure.

- [ ] **Step 4: Implement landing transition, activity cards, navigation, and week controls**

Keep the three navigation destinations persistent after Start. Home remembers whether the user is viewing cards or one activity. Week controls share one accessible button design and always include Previous Week, This Week, and Next Week.

- [ ] **Step 5: Implement schedule create/edit/detail/delete dialogs**

Use installed dialog and alert-dialog primitives, native date/time inputs, optional notes, field labels, sensible defaults, and touch-sized actions. Keep entered values when a save fails.

- [ ] **Step 6: Implement responsive activity and combined calendars**

Render a seven-day card calendar for one activity. Render an hourly Monday–Sunday planner grid at desktop sizes and a grouped agenda below the desktop breakpoint. Show activity icon, name, time, and notes without relying on color alone.

- [ ] **Step 7: Run focused tests and commit**

Run: `npm test -- --run tests/app.test.tsx`

Expected: PASS for landing, navigation, add, edit, delete, filtering, and week switching.

```bash
git add app/page.tsx components lib/repository/provider.tsx tests/app.test.tsx
git commit -m "feat: add activity scheduling experience"
```

### Task 4: Build Dee’s World

**Files:**
- Create: `components/dees-world.tsx`
- Modify: `components/app-shell.tsx`, `tests/app.test.tsx`

**Interfaces:**
- Consumes: `useAppData`, `DeeQuestion`, and `Currently`
- Produces: the complete Dee’s World view with optional editable answers, random facts, and current interests

- [ ] **Step 1: Write failing Dee’s World tests**

```tsx
await user.click(screen.getByRole("button", { name: /dee's world/i }))
expect(screen.getByRole("heading", { name: /dee's world/i })).toBeVisible()
await user.type(screen.getByLabelText(/favorite drink/i), "matcha")
await user.click(screen.getByRole("button", { name: /save favorite drink/i }))
expect(screen.getByText(/favorite drink is matcha/i)).toBeVisible()
```

Add cases for unanswered questions, one fact, cycling multiple facts without immediate repetition, and updating all four currently fields.

- [ ] **Step 2: Run the focused tests and confirm failures**

Run: `npm test -- --run tests/app.test.tsx`

Expected: FAIL because Dee’s World is not implemented.

- [ ] **Step 3: Implement compact question editors**

Show the seven requested questions as small cards with optional answer fields and individual save actions. Do not require unrelated answers and do not introduce profile categories.

- [ ] **Step 4: Implement deterministic random-fact rotation**

Build fact sentences from non-empty answers. Track the displayed index locally, rotate without immediately repeating when more than one fact exists, and show the specified empty invitation when none exist.

- [ ] **Step 5: Implement the Currently editor and run tests**

Provide Listening to, Craving, Watching, and Thinking about fields in one card with a single save action.

Run: `npm test -- --run tests/app.test.tsx`

Expected: PASS for all Dee’s World flows.

- [ ] **Step 6: Commit Dee’s World**

```bash
git add components/dees-world.tsx components/app-shell.tsx tests/app.test.tsx
git commit -m "feat: add dees world"
```

### Task 5: Add Supabase schema, setup documentation, and agent-facing browser tools

**Files:**
- Create: `supabase/schema.sql`, `.env.example`, `README.md`
- Modify: product page or provider files only as required for WebMCP registration
- Create or modify: WebMCP registration module selected by the starter

**Interfaces:**
- Consumes: database field names and repository operations from Tasks 2–4
- Produces: repeatable Supabase setup, Vercel deployment instructions, and structured tools for adding/updating schedules and Dee data where supported

- [ ] **Step 1: Write the complete SQL schema**

Create the four tables, `updated_at` trigger, foreign key and date index, four activity seeds, seven question seeds, one empty currently row, row-level security enablement, and anonymous CRUD policies. Make the seed inserts idempotent through stable UUID values and conflict handling.

- [ ] **Step 2: Add environment and setup documentation**

Document: creating a free Supabase project, running `supabase/schema.sql`, copying the project URL and anonymous key, populating local/Vercel environment variables, local development, production build, and importing the repository into Vercel. State clearly that demo data resets on refresh and anonymous policies allow anyone with the URL to edit.

- [ ] **Step 3: Add WebMCP tools for meaningful mutation journeys**

Register structured browser tools for listing activities, listing schedules by week, adding a schedule, updating a question answer, and updating Currently. Validate tool inputs against the same domain constraints and route execution through provider actions.

- [ ] **Step 4: Verify schema and documentation consistency**

Confirm every SQL column matches `lib/types.ts` and `lib/repository/supabase.ts`, every seeded string matches the UI, and both environment variable names match the client.

- [ ] **Step 5: Commit setup assets**

```bash
git add supabase .env.example README.md app components lib
git commit -m "docs: add Supabase and Vercel setup"
```

### Task 6: Final verification and delivery

**Files:**
- Modify: only files required by failures found during verification

**Interfaces:**
- Consumes: complete application
- Produces: verified Vercel-ready project

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test -- --run`

Expected: all tests PASS.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: successful build with no TypeScript or route-generation errors.

- [ ] **Step 3: Inspect the rendered experience**

Check mobile and desktop widths for landing, activity cards, activity calendar, combined planner/agenda, schedule dialogs, Dee’s World, focus visibility, bottom-nav clearance, and absence of horizontal overflow. Exercise add/edit/delete and answer updates in demo mode.

- [ ] **Step 4: Check repository hygiene**

Run: `git status --short`

Expected: only intentional source or documentation changes; no environment secrets, dependency directories, test artifacts, or build output staged.

- [ ] **Step 5: Commit verification fixes if needed**

```bash
git add app components lib tests supabase README.md .env.example package.json package-lock.json
git commit -m "fix: polish verified app flows"
```

- [ ] **Step 6: Hand off the project**

Provide the local project location, summarize verified functionality, and give the two remaining connection actions: run the included SQL in Supabase and add the two public environment variables in Vercel.
