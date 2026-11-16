import { useMemo, useState } from 'react'
import { MONTHS_LONG, WEEKDAYS, fmtMinutes, fromISODate, startOfMonth, today } from '../utils/dates.jsx'
import { WorkoutIcon } from './Icons.jsx'
import EmptyState from './EmptyState.jsx'
import './Workouts.css'

const FILTERS = [
  { id: 'all', label: 'All', noun: '' },
  { id: 'running', label: 'Running', noun: 'running' },
  { id: 'lifting', label: 'Lifting', noun: 'lifting' },
  { id: 'yoga', label: 'Yoga', noun: 'yoga' },
  { id: 'walking', label: 'Walking', noun: 'walking' },
  { id: 'other', label: 'Other', noun: 'other' },
]

/** Every workout, newest first, grouped by month. */
function Workouts({ workouts, tools, onOpen }) {
  const [filter, setFilter] = useState('all')
  const filterDef = FILTERS.find(option => option.id === filter)

  const groups = useMemo(
    () => groupByMonth(filter === 'all' ? workouts : workouts.filter(workout => workout.type === filter)),
    [workouts, filter],
  )

  return (
    <main className="screen" id="workouts">
      <header className="home-head">
        <h1 className="home-title">Workouts</h1>
        <div className="head-actions">{tools}</div>
      </header>

      {workouts.length === 0 ? (
        <EmptyState title="Nothing logged yet" body="Tap + to log a workout." />
      ) : (
        <>
          <div className="period-toggle wk-filter" role="group" aria-label="Filter by type">
            {FILTERS.map(option => (
              <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                {option.label}
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <div className="wk-group" key={filter}>
              <EmptyState title={`No ${filterDef.noun} workouts yet`} body="Tap + to log a workout." />
            </div>
          ) : (
            groups.map(group => (
              <div className="wk-group" key={group.month}>
                <h2 className="eyebrow">{fmtMonth(group.month)}</h2>
                {group.items.map(workout => {
                  const date = fromISODate(workout.date)
                  return (
                    <button key={workout.id} type="button" className="earlier-row" onClick={() => onOpen(workout.id)}>
                      <span className="earlier-icon" aria-hidden="true">
                        <WorkoutIcon workout={workout} />
                      </span>
                      <span className="earlier-text">
                        <span className="name">{workout.name}</span>
                        <span className="sub">
                          {WEEKDAYS[date.getDay()]} {date.getDate()}
                        </span>
                      </span>
                      <span className="wk-dur">{fmtMinutes(workout.durationMinutes)}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </>
      )}
    </main>
  )
}

/** "November", with the year once it isn't this one. */
function fmtMonth(value) {
  const date = fromISODate(value)
  const name = MONTHS_LONG[date.getMonth()]
  return date.getFullYear() === fromISODate(today()).getFullYear() ? name : `${name} ${date.getFullYear()}`
}

/** Months newest first, and within a month the latest workout first. */
function groupByMonth(workouts) {
  const map = new Map()
  for (const workout of workouts) {
    const month = startOfMonth(workout.date)
    map.set(month, [...(map.get(month) ?? []), workout])
  }
  const when = workout => `${workout.date} ${workout.time}`
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([month, items]) => ({ month, items: [...items].sort((a, b) => (when(a) < when(b) ? 1 : -1)) }))
}

export default Workouts
