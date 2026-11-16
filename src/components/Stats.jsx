import { useMemo, useState } from 'react'
import EmptyState from './EmptyState.jsx'
import { addDays, daysBetween, fromISODate, startOfWeek, today } from '../utils/dates.jsx'
import './Stats.css'

const PERIODS = ['1M', '3M', 'All']
const PERIOD_DAYS = { '1M': 30, '3M': 90 }

/** The dashboard: how often, how long, and how the lifts and distance are going. */
function Stats({ workouts }) {
  const [period, setPeriod] = useState('1M')
  const stats = useMemo(() => compute(workouts, period), [workouts, period])

  if (workouts.length < 3) {
    return (
      <main className="screen" id="stats">
        <header className="home-head">
          <h1 className="home-title">Stats</h1>
        </header>
        <EmptyState
          title="Not enough to show yet"
          body={
            workouts.length === 0
              ? 'Log three workouts and your numbers appear here.'
              : `Log ${3 - workouts.length} more and your numbers appear here.`
          }
        />
      </main>
    )
  }

  const maxCount = Math.max(1, ...stats.weeks.map(week => week.count))
  // Past about 13 bars the date labels collide, so only every other one is shown.
  const labelEvery = stats.weeks.length > 13 ? 2 : 1

  return (
    <main className="screen" id="stats">
      <header className="home-head">
        <h1 className="home-title">Stats</h1>
        <div className="period-toggle" role="group" aria-label="Period">
          {PERIODS.map(option => (
            <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)}>
              {option}
            </button>
          ))}
        </div>
      </header>

      <div className="st-body">
        <section className="st-section">
          <h2 className="st-eyebrow">Consistency &amp; activity</h2>
          <div className="st-card">
            <h3 className="st-card-title">Workouts per week</h3>
            <div className="st-bars" role="img" aria-label={`Workouts per week, last ${stats.weeks.length} weeks`}>
              {stats.weeks.map((week, index) => (
                <div className="st-bar" key={week.start}>
                  <span className="st-bar-n">{week.count}</span>
                  <div className="st-bar-track">
                    <i style={{ height: `${week.count === 0 ? 3 : Math.max(8, (week.count / maxCount) * 100)}%` }} />
                  </div>
                  <span className="st-bar-d">{index % labelEvery === 0 ? formatWeek(week.start) : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="st-tiles">
            <div className="st-tile">
              <span className="st-tile-k">Workouts</span>
              <span className="st-tile-v">{stats.count}</span>
            </div>
            <div className="st-tile">
              <span className="st-tile-k">Streak</span>
              <span className="st-tile-v">
                {stats.streakWeeks} {stats.streakWeeks === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            <div className="st-tile">
              <span className="st-tile-k">Avg time</span>
              <span className="st-tile-v">{stats.averageMinutes} min</span>
            </div>
          </div>
        </section>

        <section className="st-section">
          <h2 className="st-eyebrow">Strength &amp; progression</h2>
          <div className="st-card st-card-list">
            <div className="st-row st-row-head">
              <span className="st-row-k">Volume lifted</span>
              <span className="st-row-v">{stats.volumeKg.toLocaleString('en-US')} kg</span>
            </div>

            <h3 className="st-eyebrow st-sub">Top sets</h3>
            {stats.topSets.length === 0 ? (
              <div className="st-row">
                <span className="st-row-v">No lifts in this period.</span>
              </div>
            ) : (
              stats.topSets.map(top => (
                <div className="st-row" key={top.exercise}>
                  <span className="st-row-k">
                    {top.exercise}
                    {top.isRecord && <span className="st-pr">PR</span>}
                  </span>
                  <span className="st-row-v">
                    {top.weightKg} kg × {top.reps}
                  </span>
                </div>
              ))
            )}

            <div className="st-row st-row-foot">
              <span className="st-row-k">Distance</span>
              <span className="st-row-v">{stats.distanceKm} km</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

/** "11/9": the Monday a week starts on. */
function formatWeek(value) {
  const date = fromISODate(value)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/** The exercises of a lifting workout; none for any other type. */
function exercisesOf(workout) {
  return workout.type === 'lifting' ? workout.data.exercises ?? [] : []
}

function compute(all, period) {
  const now = today()
  const thisWeek = startOfWeek(now)
  const oldest = all.reduce((earliest, workout) => (workout.date < earliest ? workout.date : earliest), now)

  const from = period === 'All' ? oldest : addDays(now, -PERIOD_DAYS[period] + 1)
  const inPeriod = all.filter(workout => workout.date >= from)

  // Bars: 8 weeks for 1M, 13 for 3M, and the whole history (8 to 26 weeks) for All.
  const weekCount =
    period === '1M'
      ? 8
      : period === '3M'
        ? 13
        : Math.min(26, Math.max(8, Math.floor(daysBetween(startOfWeek(oldest), thisWeek) / 7) + 1))
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const start = addDays(thisWeek, -7 * (weekCount - 1 - index))
    const end = addDays(start, 6)
    return { start, count: all.filter(workout => workout.date >= start && workout.date <= end).length }
  })

  // Consecutive weeks with at least one workout, counting back from this week
  // (or from last week if nothing has been logged yet this week).
  let streakWeeks = 0
  let cursor = all.some(workout => workout.date >= thisWeek) ? thisWeek : addDays(thisWeek, -7)
  while (streakWeeks < 520 && all.some(workout => workout.date >= cursor && workout.date <= addDays(cursor, 6))) {
    streakWeeks++
    cursor = addDays(cursor, -7)
  }

  const averageMinutes = inPeriod.length
    ? Math.round(inPeriod.reduce((sum, workout) => sum + workout.durationMinutes, 0) / inPeriod.length)
    : 0
  const distanceKm = Math.round(inPeriod.reduce((sum, workout) => sum + (workout.data?.distanceKm ?? 0), 0) * 10) / 10

  // Lifts: volume in the period, plus the heaviest set of each exercise.
  let volumeKg = 0
  const best = new Map()
  for (const workout of inPeriod) {
    for (const exercise of exercisesOf(workout)) {
      for (const set of exercise.sets) {
        volumeKg += set.weightKg * set.reps
        const current = best.get(exercise.name)
        if (!current || set.weightKg > current.weightKg || (set.weightKg === current.weightKg && set.reps > current.reps)) {
          best.set(exercise.name, { weightKg: set.weightKg, reps: set.reps, date: workout.date })
        }
      }
    }
  }

  // A record: the period's best beats every earlier session of that exercise.
  const topSets = [...best.entries()]
    .map(([exercise, top]) => {
      const earlier = all
        .filter(workout => workout.date < top.date)
        .flatMap(exercisesOf)
        .filter(item => item.name === exercise)
        .flatMap(item => item.sets)
      const isRecord = earlier.length > 0 && earlier.every(set => set.weightKg < top.weightKg)
      return { exercise, ...top, isRecord }
    })
    .sort((a, b) => b.weightKg - a.weightKg)
    .slice(0, 3)

  return {
    weeks,
    count: inPeriod.length,
    streakWeeks,
    averageMinutes,
    distanceKm,
    volumeKg: Math.round(volumeKg),
    topSets,
  }
}

export default Stats
