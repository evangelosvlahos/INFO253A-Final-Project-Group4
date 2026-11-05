import WorkoutList from './WorkoutList.jsx'

function Home({ workouts }) {
  return (
    <main className="container" id="home">
      <h1>Home</h1>
      <p>Sample workouts</p>
      <WorkoutList workouts={workouts} />
    </main>
  )
}

export default Home
