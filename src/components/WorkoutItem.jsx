import { formatWorkoutTime } from '../utils/time.jsx'

function WorkoutItem({ workout, timeFormat }) {
  return (
    <li>
      <strong>{workout.name}</strong>
      <div>{workout.date} · {formatWorkoutTime(workout.time, timeFormat)} · {workout.durationMinutes} min · Feeling {workout.feeling}/5</div>
      {workout.type === 'running' && <div>{workout.data.distanceKm} km</div>}
      {workout.type === 'lifting' && workout.data.exercises.map((exercise, index) => (
        <div key={index}>
          {exercise.name}: {exercise.sets.map(set => `${set.reps} reps × ${set.weightKg} kg`).join(', ')}
        </div>
      ))}
      {workout.notes && <div>{workout.notes}</div>}
    </li>
  )
}

export default WorkoutItem
