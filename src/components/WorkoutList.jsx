import WorkoutItem from './WorkoutItem.jsx'

function WorkoutList({ workouts }) {
  if (workouts.length === 0) {
    return <p>No workouts to display.</p>
  }

  return (
    <ul className="workout-list">
      {workouts.map(workout => (
        <WorkoutItem key={workout.id} workout={workout} />
      ))}
    </ul>
  )
}

export default WorkoutList
