import { useEffect, useRef, useState } from 'react'
import { extractWorkout } from '../services/gemini.jsx'
import { useRecorder } from '../utils/useRecorder.jsx'
import { ALL_FEELS, FEEL_LABELS, fmtPace, points, shortDescription } from '../utils/workout.jsx'
import { daysAgo, fmtDayShort, fmtDayTitle, fmtMinutes, today } from '../utils/dates.jsx'
import { DAY_END, formatWorkoutTime, nowMinutes, toClock, toMinutes } from '../utils/time.jsx'
import { ChoiceSheet, TimeSheet } from './TimeSheet.jsx'
import NumInput, { decimal, digits, openPicker } from './NumInput.jsx'
import {
  CalendarIcon, CheckIcon, ChevronLeft, ChevronRight, ClockIcon, DistanceIcon, FlameIcon, PaceIcon, PlusIcon, RepsIcon, SetsIcon,
} from './Icons.jsx'
import './WorkoutDetail.css'
import './Log.css'

/** How long the "Workout saved" confirmation stays up before going home. */
const SAVED_MS = 1800

/** The types on offer. Each opens its own rows. */
const KINDS = [
  { id: 'running', label: 'Running' },
  { id: 'lifting', label: 'Lifting' },
  { id: 'yoga', label: 'Yoga' },
  { id: 'walking', label: 'Walking' },
  { id: 'other', label: 'Other' },
]

/* Numbers are held as text while typing, so a field can be emptied and retyped.
   The type starts out unchosen: picking it is what opens up the rest of the form. */
const blankExercise = () => ({ name: '', sets: [{ kg: '', reps: '' }] })
const blankForm = () => ({
  name: '',
  description: '',
  type: '',
  date: today(),
  time: '',
  duration: '',
  distance: '',
  feeling: null,
  exercises: [blankExercise()],
})

/**
 * Log a workout by filling in the form, laid out like the edit screen. Voice is a
 * shortcut on top of it: the round button in the nav records, Gemini works out
 * what was said, and the fields fill in. The form stays on screen throughout.
 *
 * onDone is called once the save has been confirmed on screen.
 * registerMic hands the nav's round button its role: { mode, onPress }, or null on leaving.
 */
function Log({ timeFormat = '12', apiKey, onSave, onDone, registerMic }) {
  const [phase, setPhase] = useState('form')
  const [form, setForm] = useState(blankForm)
  /** Extra detail Gemini picked up from the recording, kept with the workout. */
  const [heardNotes, setHeardNotes] = useState(null)
  /** The recording is with Gemini. */
  const [filling, setFilling] = useState(false)
  /** The last thing voice had to say: why it didn't work. */
  const [voice, setVoice] = useState(null)
  const request = useRef(null)
  /** A finished recording, waiting for "Fill form from recording". */
  const [clip, setClip] = useState(null)
  const recorder = useRecorder({ onAudio: setClip, onError: text => setVoice({ ok: false, text }) })
  const recording = recorder.status === 'recording'
  /** While voice is at work the form stays on screen, but can't be typed into. */
  const busy = recorder.status !== 'idle' || filling
  /** Which wheels are open, if any, and the row they belong to. */
  const [picking, setPicking] = useState(null)
  const [anchor, setAnchor] = useState(null)
  const set = patch => setForm(previous => ({ ...previous, ...patch }))
  const fmtTime = value => formatWorkoutTime(value, timeFormat)

  function pick(which, event) {
    setAnchor(event.currentTarget.closest('.prop'))
    setPicking(which)
  }

  const isRun = form.type === 'running'
  /** Runs and walks both cover ground; only a run has to say how far. */
  const hasDistance = isRun || form.type === 'walking'
  const isLift = form.type === 'lifting'
  const duration = Number(form.duration)
  const distance = Number(form.distance)
  const allSets = form.exercises.flatMap(exercise => exercise.sets)
  const startMin = form.time ? toMinutes(form.time) : null
  /** When it ended, in minutes from midnight; null until there's a start and a length. */
  const endMin = startMin !== null && duration > 0 ? Math.min(DAY_END, startMin + duration) : null

  function setExercise(exerciseIndex, patch) {
    set({ exercises: form.exercises.map((exercise, index) => (index === exerciseIndex ? { ...exercise, ...patch } : exercise)) })
  }

  function setCell(exerciseIndex, setIndex, patch) {
    setExercise(exerciseIndex, {
      sets: form.exercises[exerciseIndex].sets.map((item, index) => (index === setIndex ? { ...item, ...patch } : item)),
    })
  }

  /** Start recording. Without a key there's nowhere to send it, so say so instead. */
  function beginListening() {
    setVoice(null)
    setClip(null)
    setPicking(null)
    if (!apiKey.trim()) {
      setVoice({ ok: false, text: 'Voice needs a Gemini API key. Add yours in Settings, then try again.' })
      return
    }
    recorder.start()
  }

  /** Send the recording to Gemini and fill in what it heard. Anything it missed is left as it was. */
  async function fillFrom(audio) {
    const controller = new AbortController()
    request.current = controller
    const timeout = setTimeout(() => controller.abort(), 60_000)
    setFilling(true)
    setVoice(null)
    try {
      const draft = await extractWorkout({ audio, apiKey, localDate: today(), signal: controller.signal })
      if (request.current !== controller) return
      const heard = draft.data.exercises ?? []
      setForm(previous => ({
        ...previous,
        name: draft.name,
        type: draft.type,
        date: draft.date ?? previous.date,
        time: draft.time ?? previous.time,
        duration: draft.durationMinutes !== null ? String(Math.round(draft.durationMinutes)) : previous.duration,
        distance: draft.data.distanceKm != null ? String(draft.data.distanceKm) : previous.distance,
        feeling: draft.feeling ?? previous.feeling,
        description: draft.notes ? shortDescription(draft.notes) : previous.description,
        exercises: heard.length
          ? heard.map(exercise => ({
              name: exercise.name,
              sets: exercise.sets.length
                ? exercise.sets.map(item => ({
                    kg: item.weightKg !== null ? String(item.weightKg) : '',
                    reps: item.reps !== null ? String(item.reps) : '',
                  }))
                : [{ kg: '', reps: '' }],
            }))
          : previous.exercises,
      }))
      setHeardNotes(draft.notes)
      // The filled-in form is the confirmation; nothing more to say about it.
      setClip(null)
    } catch (cause) {
      if (request.current !== controller) return
      setVoice({
        ok: false,
        text: controller.signal.aborted ? 'That took too long. Try again.' : cause instanceof Error ? cause.message : 'Something went wrong. Try again.',
      })
    } finally {
      clearTimeout(timeout)
      if (request.current === controller) {
        request.current = null
        setFilling(false)
      }
    }
  }

  /** Stop listening or waiting, and leave the form as it is. */
  function cancelVoice() {
    recorder.cancel()
    request.current?.abort()
    request.current = null
    setFilling(false)
  }

  // Leaving the screen drops any request still in flight.
  useEffect(() => () => request.current?.abort(), [])

  /** The first thing still needed before saving. */
  function missing() {
    if (!form.name.trim()) return 'a workout name'
    if (!form.type) return 'a type'
    if (!form.time) return 'a start time'
    if (!(duration > 0)) return 'a duration'
    if (!form.feeling) return 'how it felt'
    if (isRun && !(distance > 0)) return 'a distance'
    if (isLift) {
      if (form.exercises.some(exercise => !exercise.name.trim())) return 'a name for each exercise'
      if (allSets.some(item => !(Number(item.reps) >= 1) || item.kg === '')) return 'weight and reps for every set'
    }
    return null
  }
  const needs = missing()

  function save() {
    if (needs) return
    const description = form.description.trim()
    // What was said in full is kept, unless the short line it became has been rewritten since.
    const notes = heardNotes && description === shortDescription(heardNotes) ? heardNotes : description
    onSave({
      name: form.name.trim(),
      date: form.date,
      time: form.time,
      durationMinutes: Math.max(1, Math.round(duration)),
      feeling: form.feeling,
      ...(notes ? { notes } : {}),
      type: form.type,
      data: isLift
        ? {
            exercises: form.exercises.map(exercise => ({
              name: exercise.name.trim(),
              sets: exercise.sets.map(item => ({ reps: Number(item.reps), weightKg: Number(item.kg) || 0 })),
            })),
          }
        : hasDistance && distance > 0
          ? { distanceKm: distance }
          : {},
    })
    setPhase('saved')
  }

  // Close the loop: confirm the save, then hand back to Home.
  useEffect(() => {
    if (phase !== 'saved') return
    const id = setTimeout(onDone, SAVED_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function reset() {
    cancelVoice()
    setClip(null)
    setForm(blankForm())
    setHeardNotes(null)
    setVoice(null)
    setPicking(null)
    setPhase('form')
  }

  // Hand the nav's round button a role that matches what voice is doing:
  // a mic to start, a tick to finish, and nothing to press while Gemini works.
  useEffect(() => {
    let control
    if (recording) control = { mode: 'listening', onPress: recorder.stop }
    else if (phase === 'saved' || busy) control = { mode: 'disabled', onPress: () => {} }
    else control = { mode: 'idle', onPress: beginListening }
    registerMic(control)
    return () => registerMic(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recording, busy, apiKey])

  // ---------- render ----------

  if (phase === 'saved') {
    return (
      <section className="screen log-screen">
        <div className="saved rise" role="status" aria-live="polite">
          <span className="saved-mark" aria-hidden="true">
            <CheckIcon />
          </span>
          <h1 className="home-title">Workout saved</h1>
          <p className="saved-sub">
            {form.name.trim()} · {fmtMinutes(Math.max(1, Math.round(duration)))} · {fmtDayShort(form.date)}
          </p>
        </div>
      </section>
    )
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(blankForm())

  return (
    <section className="screen log-screen edit">
      <div className="edit-bar">
        <button type="button" className="detail-back" aria-label="Back" onClick={onDone}>
          <ChevronLeft />
        </button>
        <h1 className="edit-bar-title">Log workout</h1>
        <button type="button" className="edit-save" disabled={needs !== null || busy} onClick={save}>
          Save
        </button>
      </div>

      {/* Voice at work, above the form it's filling in. The form stays where it is. */}
      {(busy || clip || voice) && (
        <div className="vc-said rise" role={voice && !voice.ok ? 'alert' : 'status'}>
          <div className="vc-said-top">
            <span className="vc-label">{recording ? 'Listening' : busy ? 'One moment' : clip ? 'Recording ready' : 'Voice'}</span>
            {busy ? (
              <button type="button" className="vc-rerecord" onClick={cancelVoice}>
                Cancel
              </button>
            ) : (
              clip && (
                <button type="button" className="vc-rerecord" onClick={() => setClip(null)}>
                  Discard
                </button>
              )
            )}
          </div>
          <p className="vc-quote">
            {recorder.status === 'requesting'
              ? 'Waiting for the microphone…'
              : recording
                ? 'Say what you did, then tap the tick.'
                : filling
                  ? 'Filling in the form…'
                  : (voice?.text ?? 'Your recording goes to Google Gemini to fill in the form.')}
          </p>
          {clip && !busy && (
            <div className="vc-actions">
              <button type="button" className="vc-save" onClick={() => fillFrom(clip)}>
                Fill form from recording
              </button>
            </div>
          )}
        </div>
      )}

      {/* The form itself. It can't be typed into while voice is at work. */}
      <div className={`log-fields ${busy ? 'is-busy' : ''}`} inert={busy ? '' : undefined}>
        <input
          className="detail-title edit-name"
          value={form.name}
          onChange={event => set({ name: event.target.value })}
          placeholder="Workout name"
          aria-label="Workout name"
          autoComplete="off"
        />
        <input
          className="detail-desc edit-desc"
          value={form.description}
          maxLength={60}
          onChange={event => set({ description: event.target.value })}
          placeholder="Add a short description"
          aria-label="Short description"
          autoComplete="off"
        />

        <div className="period-toggle log-kind" role="group" aria-label="Type">
          {KINDS.map(kind => (
            <button key={kind.id} type="button" aria-pressed={form.type === kind.id} onClick={() => set({ type: kind.id })}>
              {kind.label}
            </button>
          ))}
        </div>

        {/* Everything else waits for the type, then shows only the rows that type needs. */}
        {form.type && (
          <div className="props rise">
            {/* The day. The whole row opens the date picker. */}
            <label className="prop">
              <CalendarIcon className="prop-icon" aria-hidden="true" />
              <span className="k">{fmtDayTitle(form.date)}</span>
              <span className="v">{daysAgo(form.date)}</span>
              <ChevronRight className="prop-chev" aria-hidden="true" />
              <input
                type="date"
                value={form.date}
                max={today()}
                onClick={openPicker}
                onChange={event => event.target.value && set({ date: event.target.value })}
                aria-label="Date"
              />
            </label>

            {/* The time frame: start and end each open their own wheels, and the length
                can be typed on the right. Each is changed on its own. */}
            <div className="prop prop-split">
              <ClockIcon className="prop-icon" aria-hidden="true" />
              <span className="k prop-times">
                <button
                  type="button"
                  className={`prop-time ${form.time ? '' : 'is-empty'}`}
                  aria-haspopup="dialog"
                  aria-expanded={picking === 'start'}
                  aria-label={form.time ? `Start time, ${fmtTime(form.time)}` : 'Add a start time'}
                  onClick={event => pick('start', event)}
                >
                  {form.time ? fmtTime(form.time) : 'Add a start time'}
                </button>
                {endMin !== null && (
                  <>
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
                  </>
                )}
              </span>
              <label className="v">
                <NumInput label="Duration in minutes" value={form.duration} unit="min" onChange={value => set({ duration: digits(value) })} />
              </label>
              <ChevronRight className="prop-chev" aria-hidden="true" />
            </div>

            {/* How it felt: the word on the left once chosen, its points on the right. */}
            <button type="button" className="prop" aria-haspopup="dialog" aria-expanded={picking === 'feel'} onClick={event => pick('feel', event)}>
              <FlameIcon className="prop-icon" aria-hidden="true" />
              <span className={`k ${form.feeling ? '' : 'is-empty'}`}>{form.feeling ? FEEL_LABELS[form.feeling] : 'How it felt'}</span>
              <span className="v">{form.feeling ? points(form.feeling) : ''}</span>
              <ChevronRight className="prop-chev" aria-hidden="true" />
            </button>

            {hasDistance && (
              <>
                <label className="prop">
                  <DistanceIcon className="prop-icon" aria-hidden="true" />
                  <span className="k">Distance</span>
                  <span className="v">
                    <NumInput label="Distance in kilometres" value={form.distance} unit="km" onChange={value => set({ distance: decimal(value) })} />
                  </span>
                  <ChevronRight className="prop-chev" aria-hidden="true" />
                </label>
                <div className="prop">
                  <PaceIcon className="prop-icon" aria-hidden="true" />
                  <span className="k">Pace</span>
                  <span className="v">{duration > 0 && distance > 0 ? fmtPace(duration, distance) : '–'}</span>
                </div>
              </>
            )}

            {/* Counted from the set table below. */}
            {isLift && (
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
            )}
          </div>
        )}

        {/* Strength: every exercise, set by set, in the same table as the edit screen. */}
        {isLift &&
          form.exercises.map((exercise, exerciseIndex) => (
            <div className="log-exercise" key={exerciseIndex}>
              <table className="sets">
                <caption>
                  <input
                    className="log-ex-name"
                    value={exercise.name}
                    onChange={event => setExercise(exerciseIndex, { name: event.target.value })}
                    placeholder="Exercise name"
                    aria-label={`Exercise ${exerciseIndex + 1} name`}
                    autoComplete="off"
                  />
                </caption>
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
                          label={`Exercise ${exerciseIndex + 1}, set ${setIndex + 1}, kilograms`}
                          value={item.kg}
                          onChange={value => setCell(exerciseIndex, setIndex, { kg: decimal(value) })}
                        />
                      </td>
                      <td>
                        <NumInput
                          label={`Exercise ${exerciseIndex + 1}, set ${setIndex + 1}, reps`}
                          value={item.reps}
                          onChange={value => setCell(exerciseIndex, setIndex, { reps: digits(value) })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="log-row-actions">
                {/* A new set starts as a copy of the last one: most sets repeat. */}
                <button
                  type="button"
                  className="vc-add"
                  onClick={() => setExercise(exerciseIndex, { sets: [...exercise.sets, { ...exercise.sets[exercise.sets.length - 1] }] })}
                >
                  <PlusIcon aria-hidden="true" />
                  Add set
                </button>
                {exercise.sets.length > 1 && (
                  <button type="button" className="vc-add" onClick={() => setExercise(exerciseIndex, { sets: exercise.sets.slice(0, -1) })}>
                    Remove last set
                  </button>
                )}
                {form.exercises.length > 1 && (
                  <button
                    type="button"
                    className="vc-add"
                    onClick={() => set({ exercises: form.exercises.filter((_, index) => index !== exerciseIndex) })}
                  >
                    Remove exercise
                  </button>
                )}
              </div>
            </div>
          ))}
        {isLift && (
          <button type="button" className="vc-add log-add-exercise" onClick={() => set({ exercises: [...form.exercises, blankExercise()] })}>
            <PlusIcon aria-hidden="true" />
            Add exercise
          </button>
        )}
      </div>

      {/* One quiet line: how voice works to begin with, then what's still needed to save. */}
      <p className="log-hint log-status" role="status">
        {!dirty ? 'Fill it in, or tap the mic and say what you did.' : needs ? `Still needed: ${needs}.` : 'Ready to save.'}
      </p>

      <div style={{ flex: 1 }} />

      {dirty && (
        <div className="vc-actions">
          <button type="button" className="vc-discard" onClick={reset}>
            Discard
          </button>
        </div>
      )}

      {/* The start. Once there's an end it stays put, so a new start changes the length. */}
      {picking === 'start' && (
        <TimeSheet
          title="Start time"
          anchor={anchor}
          timeFormat={timeFormat}
          value={startMin ?? Math.max(0, nowMinutes() - (duration > 0 ? Math.round(duration) : 0))}
          check={minutes =>
            startMin === null || endMin === null || minutes < endMin
              ? { ok: true, text: '' }
              : { ok: false, text: `Has to be before the ${fmtTime(toClock(endMin))} end` }
          }
          onDone={minutes => {
            set(
              startMin !== null && endMin !== null
                ? { time: toClock(minutes), duration: String(endMin - minutes) }
                : { time: toClock(minutes) },
            )
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      )}

      {/* The end. The start stays where it is. */}
      {picking === 'end' && startMin !== null && endMin !== null && (
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
          index={ALL_FEELS.indexOf(form.feeling ?? 3)}
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

export default Log
