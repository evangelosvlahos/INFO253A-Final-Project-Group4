import { useEffect, useMemo, useState } from 'react'
import {
  MONTHS, MONTHS_LONG, WEEKDAYS, addDays, daysInMonth, fmtDayShort, fmtDayTitle,
  fmtMinutes, fmtMonthDay, fmtShort, fromISODate, startOfMonth, startOfWeek, today, toISODate,
} from '../utils/dates.jsx'
import { addMinutes, formatShortTime, formatWorkoutTime } from '../utils/time.jsx'
import { describe, distanceOf } from '../utils/workout.jsx'
import { CalendarIcon, ChevronLeft, ChevronRight, CloseIcon, MenuIcon, WorkoutIcon } from './Icons.jsx'
import EmptyState from './EmptyState.jsx'
import { FeelScore, WorkoutStats } from './WorkoutStats.jsx'
import './Home.css'

/** Today's workouts, or any day's through the calendar. */
function Home({ workouts, timeFormat, onOpen, onAll }) {
  const now = today()
  const [view, setView] = useState('list')
  const [picked, setPicked] = useState(now)
  const [sheetOpen, setSheetOpen] = useState(false)

  // The list is always today; the calendar browses any day.
  const day = view === 'list' ? now : picked

  const byDay = useMemo(() => {
    const map = new Map()
    for (const workout of workouts) map.set(workout.date, [...(map.get(workout.date) ?? []), workout])
    return map
  }, [workouts])

  const dayWorkouts = useMemo(
    () => [...(byDay.get(day) ?? [])].sort((a, b) => a.time.localeCompare(b.time)),
    [byDay, day],
  )

  // The most recent days before today, newest first.
  const earlier = useMemo(
    () =>
      workouts
        .filter(workout => workout.date < now)
        .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
        .slice(0, 4),
    [workouts, now],
  )
  const date = fromISODate(day)

  return (
    <main className="screen home" id="home">
      <header className="home-head">
        {view === 'list' ? (
          <h1 className="home-title">{fmtDayTitle(day)}</h1>
        ) : (
          <h1 className="home-title">
            <button
              type="button"
              className="home-title-btn"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              aria-label={`${fmtMonthDay(day)}, ${date.getFullYear()}. Choose a date`}
            >
              {fmtMonthDay(day)}, <span className="yr">{date.getFullYear()}</span>
              <ChevronRight />
            </button>
          </h1>
        )}
        <div className="view-toggle" role="tablist" aria-label="View">
          <button type="button" role="tab" aria-label="Today" title="Today" aria-selected={view === 'list'} onClick={() => setView('list')}>
            <MenuIcon />
          </button>
          <button type="button" role="tab" aria-label="Calendar" title="Calendar" aria-selected={view === 'calendar'} onClick={() => setView('calendar')}>
            <CalendarIcon />
          </button>
        </div>
      </header>

      {view === 'calendar' && <WeekStrip day={day} byDay={byDay} onPick={setPicked} />}

      {workouts.length === 0 ? (
        <EmptyState title="Nothing logged yet" body="Tap + to log a workout." />
      ) : dayWorkouts.length === 0 ? (
        <EmptyState
          key={day}
          title={day === now ? 'Nothing logged today' : 'Nothing logged'}
          body={day === now ? 'Tap + to log a workout.' : `${fmtShort(day)} was a rest day.`}
        />
      ) : dayWorkouts.length === 1 ? (
        <DayCard key={day} workout={dayWorkouts[0]} timeFormat={timeFormat} onOpen={onOpen} />
      ) : (
        <Timeline key={day} items={dayWorkouts} timeFormat={timeFormat} onOpen={onOpen} />
      )}

      {view === 'list' && earlier.length > 0 && (
        <div className="earlier">
          <div className="earlier-head">
            <span className="eyebrow">Earlier</span>
            <button type="button" className="earlier-all" onClick={onAll}>
              All workouts →
            </button>
          </div>
          {earlier.map(workout => (
            <button type="button" key={workout.id} className="earlier-row" onClick={() => onOpen(workout.id)}>
              <span className="earlier-icon" aria-hidden="true">
                <WorkoutIcon workout={workout} />
              </span>
              <span className="earlier-text">
                <span className="name">{workout.name}</span>
                <span className="sub">
                  {fmtDayShort(workout.date)} · {fmtMinutes(workout.durationMinutes)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {sheetOpen && (
        <MonthSheet
          day={day}
          byDay={byDay}
          onPick={value => {
            setPicked(value)
            setSheetOpen(false)
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </main>
  )
}

/* ---------- one workout ---------- */

function DayCard({ workout, timeFormat, onOpen }) {
  const description = describe(workout)
  return (
    <button type="button" className="day-card rise" onClick={() => onOpen(workout.id)}>
      <span className="day-card-title">{workout.name}</span>
      <span className="day-card-when">{formatWorkoutTime(workout.time, timeFormat)}</span>
      <span className="desc-row">
        {description && <span className="day-card-desc">{description}</span>}
        <FeelScore workout={workout} />
      </span>
      <WorkoutStats workout={workout} />
    </button>
  )
}

/* ---------- several in a day ---------- */

/** A spine of the day's workouts. One is opened up; tapping another opens that one instead. */
function Timeline({ items, timeFormat, onOpen }) {
  const lastId = items[items.length - 1].id
  const [openId, setOpenId] = useState(lastId)
  const active = items.some(workout => workout.id === openId) ? openId : lastId

  return (
    <ol className="tl rise">
      {items.map(workout => {
        const on = workout.id === active
        const description = describe(workout)
        const km = distanceOf(workout)
        const brief = [fmtMinutes(workout.durationMinutes), km ? `${km} km` : null].filter(Boolean).join(' · ')
        return (
          <li key={workout.id} className={on ? 'is-on' : undefined}>
            <button
              type="button"
              className="tl-item"
              aria-expanded={on}
              onClick={() => (on ? onOpen(workout.id) : setOpenId(workout.id))}
            >
              <span className="tl-times">
                <span>{formatShortTime(workout.time, timeFormat)}</span>
                <span>{formatShortTime(addMinutes(workout.time, workout.durationMinutes), timeFormat)}</span>
              </span>
              <span className="tl-node" aria-hidden="true">
                <WorkoutIcon workout={workout} />
              </span>
              {on ? (
                <span className="tl-body">
                  <span className="tl-main">
                    <span className="tl-title">{workout.name}</span>
                    <span className="desc-row">
                      {description && <span className="tl-desc">{description}</span>}
                      <FeelScore workout={workout} />
                    </span>
                    <WorkoutStats workout={workout} />
                  </span>
                </span>
              ) : (
                <span className="tl-body">
                  <span className="tl-main">
                    <span className="tl-title">{workout.name}</span>
                    <span className="tl-desc">{brief}</span>
                  </span>
                </span>
              )}
            </button>
            <span className="tl-link" aria-hidden="true" />
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- calendar: week strip ---------- */

function WeekStrip({ day, byDay, onPick }) {
  const now = today()
  const start = startOfWeek(day)
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))

  return (
    <div className="week" role="group" aria-label="Week">
      {days.map(value => {
        const date = fromISODate(value)
        const count = byDay.get(value)?.length ?? 0
        return (
          <button
            type="button"
            key={value}
            className={['week-day', value === day ? 'is-selected' : '', value === now ? 'is-today' : ''].join(' ')}
            disabled={value > now}
            aria-pressed={value === day}
            aria-label={`${fmtShort(value)}${count ? `, ${count} workout${count > 1 ? 's' : ''}` : ''}`}
            onClick={() => onPick(value)}
          >
            <span className="dow">{WEEKDAYS[date.getDay()]}</span>
            <span className="n">{date.getDate()}</span>
            <span className={`dot ${count ? '' : 'is-none'}`} />
          </button>
        )
      })}
    </div>
  )
}

/* ---------- calendar: month sheet ---------- */

function MonthSheet({ day, byDay, onPick, onClose }) {
  const now = today()
  const [month, setMonth] = useState(() => startOfMonth(day))
  /** Tapping the title swaps the day grid for a month-and-year picker. */
  const [jumping, setJumping] = useState(false)

  useEffect(() => {
    const onKey = event => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const first = fromISODate(month)
  const year = first.getFullYear()
  const nowYear = fromISODate(now).getFullYear()
  const cells = [
    ...Array(first.getDay()).fill(null), // Sunday start
    ...Array.from({ length: daysInMonth(month) }, (_, index) => toISODate(new Date(year, first.getMonth(), index + 1))),
  ]

  return (
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Choose a date">
        <span className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <button
            type="button"
            className={`sheet-title ${jumping ? 'is-open' : ''}`}
            aria-expanded={jumping}
            aria-label={`${MONTHS_LONG[first.getMonth()]} ${year}. Change month`}
            onClick={() => setJumping(!jumping)}
          >
            {MONTHS_LONG[first.getMonth()]} <span className="yr">{year}</span>
            <ChevronRight />
          </button>
          <button type="button" className="sheet-close" aria-label="Close" onClick={onClose} autoFocus>
            <CloseIcon />
          </button>
        </div>

        {jumping ? (
          <div className="jump">
            <div className="jump-year">
              <button
                type="button"
                className="icon-btn"
                aria-label="Previous year"
                onClick={() => setMonth(toISODate(new Date(year - 1, first.getMonth(), 1)))}
              >
                <ChevronLeft />
              </button>
              <span>{year}</span>
              <button
                type="button"
                className="icon-btn"
                aria-label="Next year"
                disabled={year >= nowYear}
                onClick={() => {
                  const next = toISODate(new Date(year + 1, first.getMonth(), 1))
                  setMonth(next > startOfMonth(now) ? startOfMonth(now) : next)
                }}
              >
                <ChevronRight />
              </button>
            </div>
            <div className="jump-grid">
              {MONTHS.map((name, index) => {
                const value = toISODate(new Date(year, index, 1))
                return (
                  <button
                    type="button"
                    key={name}
                    className={value === month ? 'is-selected' : undefined}
                    aria-pressed={value === month}
                    disabled={value > startOfMonth(now)}
                    onClick={() => {
                      setMonth(value)
                      setJumping(false)
                    }}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="month-grid">
            {WEEKDAYS.map(name => (
              <span key={name} className="dow" aria-hidden="true">
                {name}
              </span>
            ))}
            {cells.map((value, index) => {
              if (!value) return <span key={`p${index}`} />
              const count = byDay.get(value)?.length ?? 0
              return (
                <button
                  type="button"
                  key={value}
                  className={`month-day ${value === day ? 'is-selected' : ''}`}
                  disabled={value > now}
                  aria-pressed={value === day}
                  aria-label={`${fmtShort(value)}${count ? `, ${count} workout${count > 1 ? 's' : ''}` : ''}`}
                  onClick={() => onPick(value)}
                >
                  <span className="n">{fromISODate(value).getDate()}</span>
                  <span className={`dot ${count ? '' : 'is-none'}`} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
