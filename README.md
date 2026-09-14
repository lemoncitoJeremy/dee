# wanna know dee 💗

A cute, mobile-first little app for planning activities with Dee and learning a few things about her. It includes activity calendars, a combined weekly schedule, editable questions, random Dee facts, and a compact “Currently…” card.

## Run it locally

You need Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by Next.js. Without Supabase variables, the app uses demo mode: every interaction works, but changes reset when the page refreshes. It never uses `localStorage`.

## Connect Supabase

1. Create a free project at [Supabase](https://supabase.com/).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it once.
3. In **Project Settings → API**, copy the project URL and anonymous/public key.
4. Copy `.env.example` to `.env.local` and replace the sample values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Restart `npm run dev`. The demo notice disappears when the connection is active.

The included policies intentionally let anonymous visitors read and edit the app because this first version is shared by link only. Anyone who discovers the URL can change its data. Add authentication and tighten the row-level policies before sharing it broadly.

## Deploy to Vercel for free

1. Put this folder in your personal GitHub repository when you are ready.
2. In [Vercel](https://vercel.com/), choose **Add New → Project** and import that repository.
3. Keep the detected framework as **Next.js** and the build command as `npm run build`.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Environment Variables** for Production, Preview, and Development.
5. Deploy.

Vercel will provide a shareable URL. No paid Vercel or Supabase features are required for this version.

## Useful commands

```bash
npm test -- --run
npm run build
npm run dev
```

## Data tables

- `activities` — the four activity cards
- `schedules` — activity date, time, and notes
- `dee_questions` — optional answers for Dee’s World
- `currently` — listening to, craving, watching, and thinking about
