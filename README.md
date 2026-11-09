# INFO253A-Final-Project-Group4

Final group project for INFO 253A Fall 2026 with Evan, Chengyi, Riska, and Ernest.
See [PROPOSAL.md](PROPOSAL.md).

React + Vite, JSX + CSS, following `../hw-2`.

```sh
npm install
npm run dev
```

`npm run build` creates a production build.

The workout schema and state are in [src/App.jsx](src/App.jsx).
Workouts load from localStorage and save whenever state changes. The three
samples are used when no saved data exists or saved data cannot be loaded.
Use **Log workout** above Home to add an entry in a popup. On small screens,
the button is in the top bar.

## Settings and workout time

Settings includes light/dark mode and a 12/24-hour clock preference. These two
preferences are saved in localStorage; the API key remains in memory only.
Choose **Save settings** to apply changes; Cancel discards them.

Every new workout requires `time`, its local start time stored as `HH:mm`
(24-hour format, `00:00`–`23:59`), alongside the local `date`. Display format
does not change the stored value. Home and Calendar use the clock preference,
and the entry form accepts time in the selected format. No timezone conversion
is applied to these local date/time fields.

This is a breaking schema change. On reload, the old `fitness-log-workouts`
storage is deleted and the app starts fresh under `fitness-log-workouts-v2`.
All stored workouts must have a valid time; there is no old-format support.
Gemini must include `time` in its JSON; it may return `null` when the start time
was not spoken. The form then requires you to fill it before saving.
Gemini returns a form draft: workout and exercise names must be non-empty
strings. Unknown dates, times, and numeric details may be `null` in that draft,
but required fields must be completed before the workout can be saved.

## Voice input

1. Open **Settings** and enter your own Gemini API key. It stays in React state
   until reload; it is never saved in localStorage or included in the source.
2. Open **Log workout**, record a short description (up to 2 minutes), or upload
   an audio file (up to 10 MB). You can listen before sending it.
3. Choose **Fill form from recording** to send the audio to Google Gemini.
   Review the populated fields, complete missing details, then save normally.

The app uses native `MediaRecorder` and `fetch`, with no extra library.
Microphone recording requires HTTPS or localhost and permission. Audio stays in
memory and is discarded when the popup closes. Requests use
[`gemini-3.5-flash-lite`](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite)
with [`generateContent`](https://aistudio.google.com/api-reference/generate-content/generate-content),
a short JSON-format system prompt, and JSON response mode. The response is
validated before touching the form; unknown details stay blank for review.

This is a browser-only demo: even an in-memory key is accessible to page scripts.
localStorage is not secret storage. A deployed app with a shared key needs a
backend proxy, as described in [Google's key guidance](https://aistudio.google.com/docs/api-key#security).
Do not put a shared key in a `VITE_` variable; it would be bundled into the frontend.

## Workout calendar

The Calendar menu shows a month view with a marker on each day that has a
workout. Select a day to see its workouts and details. The calendar uses
[`react-calendar`](https://www.npmjs.com/package/react-calendar); it is listed
in `package.json` and installed with the other dependencies. To add it manually
to another checkout, run:

```sh
npm install react-calendar
```

`WorkoutCalendar` gets its data through the `workouts` prop. Each workout needs
a `date` in `YYYY-MM-DD` format and a `time` in `HH:mm` format, along with its
name, type, and duration.
