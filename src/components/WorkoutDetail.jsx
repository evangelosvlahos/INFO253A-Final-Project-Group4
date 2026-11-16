import { useState } from 'react'
import { daysAgo, fmtDayTitle, fmtMonthDay, today } from '../utils/dates.jsx'
import { DAY_END, formatWorkoutTime, nowMinutes, toClock, toMinutes } from '../utils/time.jsx'
import { ALL_FEELS, FEEL_LABELS, describe, distanceOf, exercisesOf, fmtPace, points } from '../utils/workout.jsx'
import {
  CalendarIcon, ChevronLeft, ChevronRight, ClockIcon, DistanceIcon, FlameIcon, PaceIcon, RepsIcon, SetsIcon,
} from './Icons.jsx'
import { FeelScore, WorkoutStats } from './WorkoutStats.jsx'
import { ChoiceSheet, TimeSheet } from './TimeSheet.jsx'
import NumInput, { decimal, digits, openPicker } from './NumInput.jsx'
import './WorkoutDetail.css'

/**
 * One workout, opened from Home or the list: read it, edit it in place, or delete it.
 * onUpdate gets only the fields that changed.
 */
function WorkoutDetail({ workout, timeFormat = '12', onBack, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const description = describe(workout)

  if (editing) {
    return (
      <EditWorkout
        workout={workout}
        timeFormat={timeFormat}
        onCancel={() => setEditing(false)}
        onSave={patch => {
          onUpdate(patch)
          setEditing(false)
        }}
        onDelete={onDelete}
      />
    )
  }

  return (
    <section className="screen detail">
      <div className="detail-head">
        <button type="button" className="detail-back" aria-label="Back" onClick={onBack}>
          <ChevronLeft />
        </button>
        <button type="button" className="detail-edit" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>

      <div className="detail-top rise">
        <h1 className="detail-title">{workout.name}</h1>
        {/* "Nov 15, 6:12 PM" */}
        <p className="detail-when">{fmtMonthDay(workout.date)}, {formatWorkoutTime(workout.time, timeFormat)}</p>
      </div>
      <div className="desc-row rise">
        {description && <p className="detail-desc">{description}</p>}
        <FeelScore workout={workout} />
      </div>

      <WorkoutStats workout={workout} />

      {/* Strength: every exercise, set by set. Runs and yoga have nothing more to list. */}
      {exercisesOf(workout).map((exercise, index) => (
        <table className="sets rise" key={index}>
          <caption>{exercise.name}</caption>
          <thead>
            <tr>
              <th scope="col">Set</th>
              <th scope="col">Kg</th>
              <th scope="col">Reps</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((set, setIndex) => (
              <tr key={setIndex}>
                <th scope="row">{setIndex + 1}</th>
                <td>{set.weightKg}</td>
                <td>{set.reps}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      {/* The notes in full, when the line above is only the start of them. */}
      {workout.notes && workout.notes !== description && (
        <div className="detail-note rise">
          <span className="eyebrow">Notes</span>
          <p>{workout.notes}</p>
        </div>
      )}
    </section>
  )
}

/* ---------- edit ---------- */

/**
 * The detail screen, made editable in place: the same title, stats and set tables,
 * with every value you can change shown in the accent colour.
 * Numbers are held as text while typing, so a field can be emptied and retyped.
 */
function EditWorkout({ workout, timeFormat, onCancel, onSave, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  /** Which wheels are open, if any. */
  const [picking, setPicking] = useState(null)
  /** The row that picker belongs to, so it can open just under it. */
  const [anchor, setAnchor] = useState(null)
  function pick(which, event) {
    setAnchor(event.currentTarget.closest('.prop'))
    setPicking(which)
  }
  /** The description as it stood on opening, to tell whether it was rewritten. */
  const [described] = useState(() => describe(workout) ?? '')
  const [draft, setDraft] = useState(() => ({
    name: workout.name,
    description: described,
    duration: String(workout.durationMinutes),
    distance: distanceOf(workout) ? String(distanceOf(workout)) : '',
    date: workout.date,
    time: workout.time,
    feeling: workout.feeling,
    exercises: exercisesOf(workout).map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.map(set => ({ kg: String(set.weightKg), reps: String(set.reps) })),
    })),
  }))
  const set = patch => setDraft(previous => ({ ...previous, ...patch }))
  const fmtTime = value => formatWorkoutTime(value, timeFormat)

  const hasExercises = draft.exercises.length > 0
  /** Runs and walks cover ground. A run always keeps a distance; a walk can go without. */
  const hasDistance = workout.type === 'running' || workout.type === 'walking'
  const duration = Number(draft.duration)
  const distance = Number(draft.distance)
  const allSets = draft.exercises.flatMap(exercise => exercise.sets)
  /** When it started and ended, in minutes from midnight. */
  const startMin = toMinutes(draft.time)
  const endMin = Math.min(DAY_END, startMin + (duration > 0 ? duration : 0))

  function setCell(exerciseIndex, setIndex, patch) {
    set({
      exercises: draft.exercises.map((exercise, index) =>
        index !== exerciseIndex
          ? exercise
          : { ...exercise, sets: exercise.sets.map((item, position) => (position !== setIndex ? item : { ...item, ...patch })) },
      ),
    })
  }

  function save() {
    const description = draft.description.trim()
    const patch = {
      name: draft.name.trim() || workout.name,
      durationMinutes: duration > 0 ? Math.round(duration) : workout.durationMinutes,
      date: draft.date || workout.date,
      time: draft.time,
      feeling: draft.feeling,
    }
    // The notes change only if the line was rewritten; clearing it removes them.
    if (description !== described) patch.notes = description || undefined
    if (hasExercises) {
      patch.data = {
        exercises: draft.exercises.map((exercise, index) => ({
          name: exercise.name,
          sets: exercise.sets.map((item, position) => ({
            // A set always has at least one rep; an emptied cell keeps what it had.
            reps: Number(item.reps) >= 1 ? Number(item.reps) : workout.data.exercises[index].sets[position].reps,
            weightKg: Number(item.kg) || 0,
          })),
        })),
      }
    } else if (hasDistance) {
      if (distance > 0) patch.data = { distanceKm: distance }
      else if (workout.type === 'walking') patch.data = {}
    }
    onSave(patch)
  }

  return (
    <section className="screen detail edit">
      <div className="edit-bar">
        <button type="button" className="detail-back" aria-label="Cancel" onClick={onCancel}>
          <ChevronLeft />
        </button>
        <h1 className="edit-bar-title">Edit workout</h1>
        <button type="button" className="edit-save" onClick={save}>
          Save
        </button>
      </div>

      <input
        className="detail-title edit-name"
        value={draft.name}
        onChange={event => set({ name: event.target.value })}
        placeholder="Workout name"
        aria-label="Workout name"
        autoComplete="off"
      />
      <input
        className="detail-desc edit-desc"
        value={draft.description}
        maxLength={60}
        onChange={event => set({ description: event.target.value })}
        placeholder="Add a short description"
        aria-label="Short description"
        autoComplete="off"
      />

      {/* What you can change about the session itself: one row each, value on the right. */}
      <div className="props">
        {/* The day. The whole row opens the date picker. */}
        <label className="prop">
          <CalendarIcon className="prop-icon" aria-hidden="true" />
          <span className="k">{fmtDayTitle(draft.date)}</span>
          <span className="v">{daysAgo(draft.date)}</span>
          <ChevronRight className="prop-chev" aria-hidden="true" />
          <input
            type="date"
            value={draft.date}
            max={today()}
            onClick={openPicker}
            onChange={event => event.target.value && set({ date: event.target.value })}
            aria-label="Date"
          />
        </label>

        {/* The time frame: start and end each open their own time wheels.
            Each is changed on its own: editing one never moves the other. */}
        <div className="prop prop-split">
          <ClockIcon className="prop-icon" aria-hidden="true" />
          <span className="k prop-times">
            <button
              type="button"
              className="prop-time"
              aria-haspopup="dialog"
              aria-expanded={picking === 'start'}
              aria-label={`Start time, ${fmtTime(draft.time)}`}
              onClick={event => pick('start', event)}
            >
              {fmtTime(draft.time)}
            </button>
            <span aria-hidden="true">–</span>
            <button
              type="button"
              className="prop-time"
              aria-haspopup="dialog"
              aria-expanded={picking === 'end'}
              aria-label={`End time, ${fmtTime(toClock(endMin))}`}
              onClick={event => pick('end', event)}
            >
              {fmtTime(toClock(endMin))}
            </button>
          </span>
          <label className="v">
            <NumInput label="Duration in minutes" value={draft.duration} unit="min" onChange={value => set({ duration: digits(value) })} />
          </label>
          <ChevronRight className="prop-chev" aria-hidden="true" />
        </div>

        {/* How it felt: the word on the left, its points on the right. The row opens
            the same wheels as the times, with just the points on it. */}
        <button type="button" className="prop" aria-haspopup="dialog" aria-expanded={picking === 'feel'} onClick={event => pick('feel', event)}>
          <FlameIcon className="prop-icon" aria-hidden="true" />
          <span className="k">{FEEL_LABELS[draft.feeling]}</span>
          <span className="v">{points(draft.feeling)}</span>
          <ChevronRight className="prop-chev" aria-hidden="true" />
        </button>

        {/* The rest of the numbers. With a set table they're counted from it, so they
            read as plain values here: no accent, no chevron. */}
        {hasExercises ? (
          <>
            <div className="prop">
              <SetsIcon className="prop-icon" aria-hidden="true" />
              <span className="k">Sets</span>
              <span className="v">{allSets.length}</span>
            </div>
            <div className="prop">
              <RepsIcon className="prop-icon" aria-hidden="true" />
              <span className="k">Reps</span>
              <span className="v">{allSets.reduce((count, item) => count + (Number(item.reps) || 0), 0)}</span>
            </div>
          </>
        ) : (
          hasDistance && (
            <>
              <label className="prop">
                <DistanceIcon className="prop-icon" aria-hidden="true" />
                <span className="k">Distance</span>
                <span className="v">
                  <NumInput label="Distance in kilometres" value={draft.distance} unit="km" onChange={value => set({ distance: decimal(value) })} />
                </span>
                <ChevronRight className="prop-chev" aria-hidden="true" />
              </label>
              <div className="prop">
                <PaceIcon className="prop-icon" aria-hidden="true" />
                <span className="k">Pace</span>
                <span className="v">{duration > 0 && distance > 0 ? fmtPace(duration, distance) : '–'}</span>
              </div>
            </>
          )
        )}
      </div>

      {draft.exercises.map((exercise, exerciseIndex) => (
        <table className="sets" key={exerciseIndex}>
          <caption>{exercise.name}</caption>
          <thead>
            <tr>
              <th scope="col">Set</th>
              <th scope="col">Kg</th>
              <th scope="col">Reps</th>
            </tr>
          </thead>
          <tbody>
            {exercise.sets.map((item, setIndex) => (
              <tr key={setIndex}>
                <th scope="row">{setIndex + 1}</th>
                <td>
                  <NumInput
                    label={`${exercise.name}, set ${setIndex + 1}, kilograms`}
                    value={item.kg}
                    onChange={value => setCell(exerciseIndex, setIndex, { kg: decimal(value) })}
                  />
                </td>
                <td>
                  <NumInput
                    label={`${exercise.name}, set ${setIndex + 1}, reps`}
                    value={item.reps}
                    onChange={value => setCell(exerciseIndex, setIndex, { reps: digits(value) })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}

      <div style={{ flex: 1 }} />

      <div className="vc-actions">
        {confirmDelete ? (
          <>
            <p className="log-hint">Delete this workout? This can’t be undone.</p>
            <button type="button" className="vc-save" onClick={onDelete}>
              Delete workout
            </button>
            <button type="button" className="vc-discard" onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="vc-discard" onClick={() => setConfirmDelete(true)}>
            Delete workout
          </button>
        )}
      </div>

      {/* The start. The end stays where it is, so a new start changes how long it ran. */}
      {picking === 'start' && (
        <TimeSheet
          title="Start time"
          anchor={anchor}
          timeFormat={timeFormat}
          value={startMin}
          check={minutes =>
            !(duration > 0) || minutes < endMin
              ? { ok: true, text: '' }
              : { ok: false, text: `Has to be before the ${fmtTime(toClock(endMin))} end` }
          }
          onDone={minutes => {
            set(duration > 0 ? { time: toClock(minutes), duration: String(endMin - minutes) } : { time: toClock(minutes) })
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}

      {/* The end. The start stays where it is. */}
      {picking === 'end' && (
        <TimeSheet
          title="End time"
          anchor={anchor}
          timeFormat={timeFormat}
          value={endMin}
          check={minutes =>
            minutes > startMin
              ? { ok: true, text: '' }
              : { ok: false, text: `Has to be after the ${fmtTime(toClock(startMin))} start` }
          }
          onDone={minutes => {
            set({ duration: String(minutes - startMin) })
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}

      {picking === 'feel' && (
        <ChoiceSheet
          title="How it felt"
          anchor={anchor}
          items={ALL_FEELS.map(points)}
          index={ALL_FEELS.indexOf(draft.feeling)}
          note={index => FEEL_LABELS[ALL_FEELS[index]]}
          onDone={index => {
            set({ feeling: ALL_FEELS[index] })
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}
    </section>
  )
}

export default WorkoutDetail
