import { useState } from 'react'
import WorkoutHistoryList from './WorkoutHistoryList.jsx'
import './WorkoutHistory.css'

function WorkoutHistory({ workouts, onDelete, timeFormat }) {
  const [filterType, setFilterType] = useState('week')
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  const getWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00')
    const day = (date.getDay() + 6) % 7
    date.setDate(date.getDate() - day)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  const getMonth = (dateString) => dateString.slice(0, 7)

  const weeks = [...new Set(workouts.map(workout => getWeek(workout.date)))].sort().reverse()
  const months = [...new Set(workouts.map(workout => getMonth(workout.date)))].sort().reverse()

  const periods = filterType === 'week' ? weeks : months

  const filteredWorkouts = workouts.filter(workout => {
    if (selectedPeriod === 'all') return true
    if (filterType === 'week') return getWeek(workout.date) === selectedPeriod
    return getMonth(workout.date) === selectedPeriod
  })

  const groupedWorkouts = {}

  filteredWorkouts.forEach(workout => {
    const week = getWeek(workout.date)
    if (!groupedWorkouts[week]) groupedWorkouts[week] = []
    groupedWorkouts[week].push(workout)
  })

  const visibleWeeks = Object.keys(groupedWorkouts).sort().reverse()

  return (
    <main className="container" id="history">
      <h1>Workout History</h1>
      <p>Your completed workouts organized by week.</p>

      <div className="workout-history-filters">
        <label>
          Filter by
          <select value={filterType} onChange={event => {
            setFilterType(event.target.value)
            setSelectedPeriod('all')
          }}>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>

        <label>
          Select period
          <select value={selectedPeriod} onChange={event => setSelectedPeriod(event.target.value)}>
            <option value="all">All {filterType === 'week' ? 'weeks' : 'months'}</option>
            {periods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </label>
      </div>

      {visibleWeeks.length === 0 && <p>No workouts to display.</p>}

      {visibleWeeks.map(week => {
        const monday = new Date(week + 'T00:00:00')
        const sunday = new Date(monday)
        sunday.setDate(sunday.getDate() + 6)

        return (
          <section key={week} className="workout-history-section">
            <h2>
              {monday.toLocaleDateString('en-US', {month:'short',day:'numeric'})}
              {' – '}
              {sunday.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}
            </h2>
            <WorkoutHistoryList workouts={groupedWorkouts[week]} onDelete={onDelete} timeFormat={timeFormat}/>
          </section>
        )
      })}
    </main>
  )
}

export default WorkoutHistory

