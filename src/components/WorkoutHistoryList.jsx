import { formatWorkoutTime } from '../utils/time.jsx'

function WorkoutHistoryList({ workouts, onDelete, timeFormat }) {
  if (workouts.length === 0) {
    return <p>No workouts to display.</p>
  }

  return (
    <ul className="workout-history-list">
      {workouts.map((workout) => (
        <li key={workout.id}>
          <div>
            <strong>{workout.name}</strong>
            <p>
              {workout.date} · {formatWorkoutTime(workout.time, timeFormat)} · {workout.durationMinutes} min · Feeling {workout.feeling}/5
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDelete(workout.id)}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}

export default WorkoutHistoryList