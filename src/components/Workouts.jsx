import { useMemo, useState } from 'react'
import {
  MONTHS_LONG, WEEKDAYS, addDays, daysInMonth, fmtMinutes, fromISODate, startOfMonth, startOfWeek, today,
} from '../utils/dates.jsx'
import { CalendarIcon, ChevronRight, WorkoutIcon } from './Icons.jsx'
import { ChoiceSheet } from './TimeSheet.jsx'
import EmptyState from './EmptyState.jsx'
import './WorkoutDetail.css'
import './Workouts.css'

const FILTERS = [
  { id: 'all', label: 'All', noun: '' },
  { id: 'running', label: 'Running', noun: 'running' },
  { id: 'lifting', label: 'Lifting', noun: 'lifting' },
  { id: 'yoga', label: 'Yoga', noun: 'yoga' },
  { id: 'walking', label: 'Walking', noun: 'walking' },
  { id: 'other', label: 'Other', noun: 'other' },
]

/** Every workout, newest first, grouped by month. Narrowed by type, and by a week or a month. */
function Workouts({ workouts, tools, onOpen }) {
  const [filter, setFilter] = useState('all')
  const [periodId, setPeriodId] = useState('all')
  /** The row the wheel belongs to while it's open, so it can sit just under it. */
  const [anchor, setAnchor] = useState(null)
  const filterDef = FILTERS.find(option => option.id === filter)

  const periods = useMemo(() => periodsOf(workouts), [workouts])
  // A chosen month drops off the wheel when its last workout is deleted; fall back to everything.
  const period = periods.find(option => option.id === periodId) ?? periods[0]

  const ofType = useMemo(
    () => (filter === 'all' ? workouts : workouts.filter(workout => workout.type === filter)),
    [workouts, filter],
  )
  const groups = useMemo(() => groupByMonth(ofType.filter(workout => inPeriod(workout, period))), [ofType, period])

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
          {/* Which stretch of time to show: the same row and wheel as the edit screen. */}
          <div className="props wk-period">
            <button
              type="button"
              className="prop"
              aria-haspopup="dialog"
              aria-expanded={anchor !== null}
              onClick={event => setAnchor(event.currentTarget)}
            >
              <CalendarIcon className="prop-icon" aria-hidden="true" />
              <span className="k">Period</span>
              <span className="v">{period.label}</span>
              <ChevronRight className="prop-chev" aria-hidden="true" />
            </button>
          </div>

          <div className="period-toggle wk-filter" role="group" aria-label="Filter by type">
            {FILTERS.map(option => (
              <button key={option.id} type="button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
                {option.label}
              </button>
            ))}
          </div>

          {groups.length === 0 ? (
            <div className="wk-group" key={`${filter} ${period.id}`}>
              <EmptyState
                title={
                  period.id === 'all'
                    ? `No ${filterDef.noun} workouts yet`
                    : `No ${filterDef.noun ? `${filterDef.noun} ` : ''}workouts ${period.phrase}`
                }
                body="Tap + to log a workout."
              />
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

      {anchor && (
        <ChoiceSheet
          title="Period"
          anchor={anchor}
          items={periods.map(option => option.label)}
          index={periods.indexOf(period)}
          note={index => countLabel(ofType.filter(workout => inPeriod(workout, periods[index])).length)}
          onDone={index => {
            setPeriodId(periods[index].id)
            setAnchor(null)
          }}
          onClose={() => setAnchor(null)}
        />
      )}
    </main>
  )
}

/**
 * What the period wheel offers: everything, this week and last, then each month that has a workout.
 * Weeks start on Monday. `phrase` is how the period reads after "No workouts".
 */
function periodsOf(workouts) {
  const thisWeek = startOfWeek(today())
  const lastWeek = addDays(thisWeek, -7)
  const months = [...new Set(workouts.map(workout => startOfMonth(workout.date)))].sort().reverse()
  return [
    { id: 'all', label: 'All time', phrase: '' },
    { id: 'this-week', label: 'This week', phrase: 'this week', from: thisWeek, to: addDays(thisWeek, 6) },
    { id: 'last-week', label: 'Last week', phrase: 'last week', from: lastWeek, to: addDays(lastWeek, 6) },
    ...months.map(month => ({
      id: month,
      label: fmtMonth(month),
      phrase: `in ${fmtMonth(month)}`,
      from: month,
      to: addDays(month, daysInMonth(month) - 1),
    })),
  ]
}

function inPeriod(workout, period) {
  return !period.from || (workout.date >= period.from && workout.date <= period.to)
}

function countLabel(count) {
  return count === 0 ? 'No workouts' : count === 1 ? '1 workout' : `${count} workouts`
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
