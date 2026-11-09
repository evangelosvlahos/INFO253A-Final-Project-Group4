import WorkoutItem from './WorkoutItem.jsx'

function WorkoutList({ workouts, timeFormat }) {
  if (workouts.length === 0) {
    return <p>No workouts to display.</p>
  }

  return (
    <ul className="workout-list">
      {workouts.map(workout => (
        <WorkoutItem key={workout.id} workout={workout} timeFormat={timeFormat} />
      ))}
    </ul>
  )
}

export default WorkoutList
