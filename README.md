# INFO253A-Final-Project-Group4

Final group project for INFO 253A Fall 2026 with Evan, Chengyi, Riska, and Ernest.
See [PROPOSAL.md](PROPOSAL.md).

React + Vite, JSX + CSS, following `../hw-2`.

```sh
npm install
npm run dev
```

`npm run build` creates a production build.

## Screens

The bottom bar has **Home**, **Workouts**, **Stats** and a round **+** button.

- **Home** shows today's workouts and earlier ones. The toggle in the title row
  switches to a month calendar with a marker on each day that has a workout;
  select a day to see its workouts.
- **Workouts** lists every workout by month, newest first. Narrow it by period
  (this week, last week, or a month) and by type.
- **Stats** is the summary dashboard: workouts per week, the current weekly
  streak, lifting volume and top sets, for the chosen period.
- **+** opens **Log workout**. Fill in the form, or log by voice (see below).
- Select any workout to open it. From there you can edit or delete it.

The title row of each tab also has the light/dark switch and the Settings
button. Dark is the default.

## Workout data

The workout schema and state are in [src/App.jsx](src/App.jsx).
Workouts load from localStorage and save whenever state changes. The three
samples are used when no saved data exists or saved data cannot be loaded.

Workout types are `running`, `lifting`, `yoga`, `walking` and `other`. Running
stores a distance, walking may store one, lifting stores exercises with their
sets, and yoga and other store no extra data.

Every workout requires `time`, its local start time stored as `HH:mm`
(24-hour format, `00:00`–`23:59`), alongside the local `date` as `YYYY-MM-DD`.
No timezone conversion is applied to these local date/time fields.

Workouts are stored under `fitness-log-workouts-v2`. On reload, the old
`fitness-log-workouts` storage is deleted. All stored workouts must have a
valid time; there is no old-format support.

## Settings

Settings has the 12/24-hour clock preference and the Gemini API key. Choose
**Save** to apply changes; the back button discards them.

The clock preference changes how times are shown and how the time pickers
work, not the stored value. The theme and clock preference are saved in
localStorage under `fitness-log-preferences`; the API key remains in memory
only.

## Voice input

1. Open **Settings** and enter your own Gemini API key. It stays in React state
   until reload; it is never saved in localStorage or included in the source.
2. Open **Log workout** and tap **Speak**. Describe the workout (up to
   2 minutes), then tap **Done**.
3. Choose **Fill form from recording** to send the audio to Google Gemini, or
   **Discard** to drop it. Review the populated fields, complete what is still
   needed, then save.

The app uses native `MediaRecorder` and `fetch`, with no extra library.
Microphone recording requires HTTPS or localhost and permission. Audio stays in
memory only and is never saved. Requests use
[`gemini-3.5-flash-lite`](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite)
with [`generateContent`](https://aistudio.google.com/api-reference/generate-content/generate-content),
a short JSON-format system prompt, and JSON response mode. The response is
validated before touching the form. Gemini returns a form draft: workout and
exercise names must be non-empty strings; unknown dates, times, and numeric
details may be `null` and stay blank for review, but required fields must be
completed before the workout can be saved.

This is a browser-only demo: even an in-memory key is accessible to page scripts.
localStorage is not secret storage. A deployed app with a shared key needs a
backend proxy, as described in [Google's key guidance](https://aistudio.google.com/docs/api-key#security).

For local development only, you can copy [.env.example](.env.example) to
`.env.local` and put your own key in `VITE_GEMINI_API_KEY`, so you do not have
to retype it after each reload. A key typed in Settings is used first.
`.env.local` is ignored by git. Vite bundles `VITE_` variables into the built
JavaScript, so never build or deploy with a real key there, and never use a
shared key.

## Code layout

- [src/App.jsx](src/App.jsx): schema, state, storage, and which screen is shown.
- [src/index.css](src/index.css): colour tokens for both themes and shared styles.
- `src/components/`: one `.jsx` file per screen or shared part, with its CSS beside it.
- `src/services/gemini.jsx`: the Gemini request and response validation.
- `src/utils/`: date, time and workout helpers, and the recorder hook.

Icons come from [`lucide-react`](https://www.npmjs.com/package/lucide-react).
The calendar is built in `Home.jsx`; `react-calendar` is no longer used.
