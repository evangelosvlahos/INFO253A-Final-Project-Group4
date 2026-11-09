import WorkoutList from './WorkoutList.jsx'

function Home({ workouts, timeFormat }) {
  return (
    <main className="container" id="home">
      <h1>Home</h1>
      <p>Workouts</p>
      <WorkoutList workouts={workouts} timeFormat={timeFormat} />
    </main>
  )
}

export default Home
