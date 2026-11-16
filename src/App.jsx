import './App.css'
import Home from './components/Home.jsx'
import Nav from './components/Nav.jsx'
import { MoonIcon, SettingsIcon, SunIcon } from './components/Icons.jsx'

import { useState, useEffect } from 'react'
import Workouts from './components/Workouts.jsx'
import Log from './components/Log.jsx'
import WorkoutDetail from './components/WorkoutDetail.jsx'
import Settings from './components/Settings.jsx'
import Stats from './components/Stats.jsx'
import { ENV_API_KEY } from './services/gemini.jsx'
import { isValidTime } from './utils/time.jsx'

/**
 * @typedef {Object} BaseWorkout
 * @property {string} id
 * @property {string} name Non-empty workout title.
 * @property {string} date YYYY-MM-DD (local date).
 * @property {string} time Workout start time, HH:mm (24-hour local time).
 * @property {number} durationMinutes
 * @property {1 | 2 | 3 | 4 | 5} feeling 1 = very bad, 5 = great.
 * @property {string} [notes]
 */

/** @typedef {{ reps: number, weightKg: number }} WorkoutSet */
/** @typedef {{ name: string, sets: WorkoutSet[] }} WorkoutExercise */

/**
 * @typedef {BaseWorkout & (
 *   { type: 'running', data: { distanceKm: number } } |
 *   { type: 'lifting', data: { exercises: WorkoutExercise[] } } |
 *   { type: 'yoga', data: Record<string, never> } |
 *   { type: 'walking', data: { distanceKm?: number } } |
 *   { type: 'other', data: Record<string, never> }
 * )} Workout
 */

const STORAGE_KEY = 'fitness-log-workouts-v2'
const PREFERENCES_KEY = 'fitness-log-preferences'

/** @type {Workout[]} */
const sampleWorkouts = [
  {
    id: '1',
    name: 'Morning run',
    date: '2026-11-04',
    time: '07:30',
    durationMinutes: 30,
    feeling: 4,
    notes: 'Easy run around campus.',
    type: 'running',
    data: { distanceKm: 5 },
  },
  {
    id: '2',
    name: 'Strength training',
    date: '2026-11-03',
    time: '17:45',
    durationMinutes: 45,
    feeling: 3,
    type: 'lifting',
    data: {
      exercises: [
        {
          name: 'Squat',
          sets: [
            { reps: 8, weightKg: 40 },
            { reps: 8, weightKg: 40 },
          ],
        },
      ],
    },
  },
  {
    id: '3',
    name: 'Yoga',
    date: '2026-11-02',
    time: '18:00',
    durationMinutes: 20,
    feeling: 5,
    notes: 'A short stretch after class.',
    type: 'yoga',
    data: {},
  },
]

function App() {
  const [activeView, setActiveView] = useState('home');
  // What the nav's round button does while the Log screen is open.
  const [mic, setMic] = useState(null)
  // The workout opened on its own screen, if any.
  const [openId, setOpenId] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY))
      return {
        theme: saved?.theme === 'light' ? 'light' : 'dark',
        timeFormat: saved?.timeFormat === '24' ? '24' : '12',
      }
    } catch {
      return { theme: 'dark', timeFormat: '12' }
    }
  })
  const [workouts, setWorkouts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === null) return sampleWorkouts

      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) && parsed.every(workout => workout && isValidTime(workout.time)) ? parsed : sampleWorkouts
    } catch {
      return sampleWorkouts
    }
  })

  useEffect(() => {
    try {
      localStorage.removeItem('fitness-log-workouts')
    } catch {
      console.warn('Could not remove old workout data.')
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
    } catch {
      console.warn('Could not save workouts.')
    }
  }, [workouts])

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
  }, [preferences.theme])

  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ theme: preferences.theme, timeFormat: preferences.timeFormat }))
    } catch {
      console.warn('Could not save display preferences.')
    }
  }, [preferences])

  function handleSaveWorkout(entry) {
    const workout = { ...entry, id: crypto.randomUUID() }
    setWorkouts(previous => [workout, ...previous])
  }

  function handleUpdateWorkout(id, patch) {
    setWorkouts(previous => previous.map(workout => (workout.id === id ? { ...workout, ...patch } : workout)))
  }

  function handleDeleteWorkout(id) {
    setWorkouts(previous => previous.filter(workout => workout.id !== id))
  }

  function goTo(view) {
    setOpenId(null)
    setActiveView(view)
    window.scrollTo(0, 0)
  }

  function openWorkout(id) {
    setOpenId(id)
    window.scrollTo(0, 0)
  }

  const openedWorkout = openId ? workouts.find(workout => workout.id === openId) : undefined

  const isDark = preferences.theme === 'dark'

  // Theme and settings. Each screen places them at the right end of its title row.
  const tools = (
    <div className="head-tools">
      {/* One tap flips the theme; the icon shows the theme it will switch to. */}
      <button
        className="icon-btn"
        type="button"
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={() => setPreferences(previous => ({ ...previous, theme: isDark ? 'light' : 'dark' }))}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      <button className="icon-btn" type="button" aria-label="Settings" aria-haspopup="dialog" onClick={() => setIsSettingsOpen(true)}>
        <SettingsIcon />
      </button>
    </div>
  )

  return (
    <div className="app">
      <div className="frame">
        {openedWorkout && (
          <WorkoutDetail
            workout={openedWorkout}
            timeFormat={preferences.timeFormat}
            onBack={() => openWorkout(null)}
            onUpdate={patch => handleUpdateWorkout(openedWorkout.id, patch)}
            onDelete={() => {
              handleDeleteWorkout(openedWorkout.id)
              openWorkout(null)
            }}
          />
        )}
        {!openedWorkout && activeView === 'home' && (
          <Home
            workouts={workouts}
            timeFormat={preferences.timeFormat}
            tools={tools}
            onOpen={openWorkout}
            onAll={() => goTo('workouts')}
          />
        )}
        {!openedWorkout && activeView === 'workouts' && (
          <Workouts workouts={workouts} tools={tools} onOpen={openWorkout} />
        )}
        {!openedWorkout && activeView === 'stats' && <Stats workouts={workouts} tools={tools} />}
        {!openedWorkout && activeView === 'log' && (
          <Log
            timeFormat={preferences.timeFormat}
            // The key typed in Settings comes first; .env.local is the fallback for local development.
            apiKey={apiKey.trim() || ENV_API_KEY}
            onSave={handleSaveWorkout}
            onDone={() => goTo('home')}
            registerMic={setMic}
          />
        )}
        {/* A workout is a pushed screen: back button, no tab bar. */}
        {!openedWorkout && <Nav tab={activeView} onChange={goTo} mic={mic} />}
      </div>
      {isSettingsOpen && <Settings apiKey={apiKey} preferences={preferences} onSave={settings => { setApiKey(settings.apiKey); setPreferences(settings.preferences); setIsSettingsOpen(false) }} onClose={() => setIsSettingsOpen(false)} />}
    </div>
  )
}

export default App
