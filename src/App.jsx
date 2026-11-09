import './App.css'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import inboxIcon from './assets/inbox_icon.png'
import calendarIcon from './assets/calendar_icon.png'
import upcomingIcon from './assets/upcoming_icon.png'

import { useState, useEffect } from 'react'
import WorkoutCalendar from './components/WorkoutCalendar.jsx'
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
 *   { type: 'other', data: Record<string, never> }
 * )} Workout
 */

const STORAGE_KEY = 'fitness-log-workouts-v2'

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
    type: 'other',
    data: {},
  },
]

function App() {
  const [activeView, setActiveView] = useState('home');
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

  return (
    <div className="app">
      <Header />
      <div className="container-wrapper">
        <nav className="nav" aria-label="Main navigation">
          <ul className="nav-list">
            <li><a href="#home" onClick={() => setActiveView('home')}><img src={inboxIcon} alt="" /> Home <span className="count">{workouts.length}</span></a></li>
            <li><a href="#calendar" onClick={() => setActiveView('calendar')}><img src={calendarIcon} alt="" /> Calendar <span className="count">{workouts.length}</span></a></li>
            <li><a aria-disabled="true"><img src={upcomingIcon} alt="" /> Dashboard</a></li>
          </ul>
        </nav>
        {activeView === 'home' && <Home workouts={workouts} />}
        {activeView === 'calendar' && <WorkoutCalendar workouts={workouts} />}
      </div>
    </div>
  )
}

export default App
