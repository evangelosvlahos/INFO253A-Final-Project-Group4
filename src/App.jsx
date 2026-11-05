import './App.css'
import Header from './components/Header.jsx'
import Home from './components/Home.jsx'
import inboxIcon from './assets/inbox_icon.png'
import calendarIcon from './assets/calendar_icon.png'
import upcomingIcon from './assets/upcoming_icon.png'

/**
 * @typedef {Object} BaseWorkout
 * @property {string} id
 * @property {string} name
 * @property {string} date YYYY-MM-DD (local date).
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

function App() {
  /** @type {Workout[]} */
  const workouts = [
    {
      id: '1',
      name: 'Morning run',
      date: '2026-11-04',
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
      durationMinutes: 20,
      feeling: 5,
      notes: 'A short stretch after class.',
      type: 'other',
      data: {},
    },
  ]

  return (
    <div className="app">
      <Header />
      <div className="container-wrapper">
        <nav className="nav" aria-label="Main navigation">
          <ul className="nav-list">
            <li><a href="#home"><img src={inboxIcon} alt="" /> Home <span className="count">{workouts.length}</span></a></li>
            <li><a aria-disabled="true"><img src={calendarIcon} alt="" /> Calendar</a></li>
            <li><a aria-disabled="true"><img src={upcomingIcon} alt="" /> Dashboard</a></li>
          </ul>
        </nav>
        <Home workouts={workouts} />
      </div>
    </div>
  )
}

export default App
