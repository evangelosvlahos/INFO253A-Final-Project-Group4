import { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './WorkoutCalendar.css'
import { formatWorkoutTime } from '../utils/time.jsx'

/**
 * @typedef {Object} Workout
 * @property {string} id
 * @property {string} name
 * @property {string} date YYYY-MM-DD
 * @property {string} time HH:mm (local start time).
 * @property {number} durationMinutes
 * @property {string} type
 * @property {string} [notes]
 */

/**
 * @param {{ workouts: Workout[] }} props
 */
function WorkoutCalendar({ workouts, timeFormat }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const selectedDateKey = toDateKey(selectedDate)
  const selectedWorkouts = workouts.filter((workout) => workout.date === selectedDateKey)

  return (
    <main className="container workout-calendar">
      <h1>Workout Calendar</h1>
      <p>Select a day to see its workouts. Markers indicate days with workouts.</p>
      <Calendar
        onChange={(date) => {
          if (date instanceof Date) {
            setSelectedDate(date)
          }
        }}
        value={selectedDate}
        tileContent={({ date, view }) => {
          if (view !== 'month') {
            return null
          }

          const count = workouts.filter((workout) => workout.date === toDateKey(date)).length
          return count > 0
            ? <span className="workout-calendar__marker" aria-label={`${count} workout${count === 1 ? '' : 's'}`} />
            : null
        }}
      />

      <section className="workout-calendar__details" aria-live="polite">
        <h2>
          Workouts for {selectedDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </h2>
        {selectedWorkouts.length === 0 ? (
          <p>No workouts scheduled for this day.</p>
        ) : (
          <ul>
            {selectedWorkouts.map((workout) => (
              <li key={workout.id}>
                <strong>{workout.name}</strong>
                <span>{formatWorkoutTime(workout.time, timeFormat)} · {workout.type} · {workout.durationMinutes} min</span>
                {workout.notes && <p>{workout.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default WorkoutCalendar
