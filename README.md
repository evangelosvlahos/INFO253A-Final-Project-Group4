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

Every workout requires a local start `time` in `HH:mm` format (00:00–23:59),
alongside the local `date`. Home and Calendar display the start time.
On reload, old `fitness-log-workouts` storage is deleted and the app starts
fresh under `fitness-log-workouts-v2`. All saved entries require a valid time.

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
