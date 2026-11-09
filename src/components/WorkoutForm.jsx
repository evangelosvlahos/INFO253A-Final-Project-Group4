import { useEffect, useRef, useState } from 'react'
import VoiceInput from './VoiceInput.jsx'
import WorkoutTimeInput from './WorkoutTimeInput.jsx'
import { isValidTime } from '../utils/time.jsx'

function WorkoutForm({ apiKey, timeFormat = '12', onOpenSettings, onAdd, onClose }) {
  const dialogRef = useRef(null)
  const [form, setForm] = useState(() => {
    const today = new Date()
    return {
      name: '',
      type: 'running',
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      time: '',
      durationMinutes: '',
      feeling: '3',
      distanceKm: '',
      notes: '',
    }
  })
  const [exercises, setExercises] = useState([{ name: '', sets: [{ reps: '', weightKg: '' }] }])
  const [error, setError] = useState('')
  const [isVoiceBusy, setIsVoiceBusy] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target
    setForm(previous => ({ ...previous, [name]: value }))
  }

  function handleVoiceDraft(draft) {
    setForm(previous => ({
      name: draft.name,
      type: draft.type,
      date: draft.date ?? previous.date,
      time: draft.time ?? '',
      durationMinutes: draft.durationMinutes === null ? '' : String(draft.durationMinutes),
      feeling: draft.feeling === null ? '' : String(draft.feeling),
      distanceKm: draft.type === 'running' && draft.data.distanceKm !== null ? String(draft.data.distanceKm) : '',
      notes: draft.notes ?? '',
    }))
    const blankSet = { reps: '', weightKg: '' }
    setExercises(draft.type === 'lifting' && draft.data.exercises.length ? draft.data.exercises.map(exercise => ({
      name: exercise.name,
      sets: exercise.sets.length ? exercise.sets.map(set => ({
        reps: set.reps === null ? '' : String(set.reps),
        weightKg: set.weightKg === null ? '' : String(set.weightKg),
      })) : [{ ...blankSet }],
    })) : [{ name: '', sets: [{ ...blankSet }] }])
    setError('')
  }

  function updateExercise(index, changes) {
    setExercises(previous => previous.map((exercise, i) => (
      i === index ? { ...exercise, ...changes } : exercise
    )))
  }

  function updateSet(exerciseIndex, setIndex, field, value) {
    const exercise = exercises[exerciseIndex]
    updateExercise(exerciseIndex, {
      sets: exercise.sets.map((set, i) => i === setIndex ? { ...set, [field]: value } : set),
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (isVoiceBusy) return
    if (!form.name.trim()) {
      setError('Please enter a workout name.')
      return
    }
    if (!isValidTime(form.time)) {
      setError('Please enter the workout start time.')
      return
    }
    if (form.type === 'lifting' && exercises.some(exercise => !exercise.name.trim())) {
      setError('Please enter a name for each exercise.')
      return
    }

    let data = {}
    if (form.type === 'running') {
      data = { distanceKm: Number(form.distanceKm) }
    } else if (form.type === 'lifting') {
      data = {
        exercises: exercises.map(exercise => ({
          name: exercise.name.trim(),
          sets: exercise.sets.map(set => ({ reps: Number(set.reps), weightKg: Number(set.weightKg) })),
        })),
      }
    }

    onAdd({
      name: form.name.trim(),
      date: form.date,
      time: form.time,
      durationMinutes: Number(form.durationMinutes),
      feeling: Number(form.feeling),
      type: form.type,
      data,
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    })
  }

  return (
    <dialog ref={dialogRef} className="workout-dialog" aria-labelledby="workout-form-title" onCancel={onClose}>
      <form className="workout-form" onSubmit={handleSubmit}>
        <h1 id="workout-form-title">Log workout</h1>
        <VoiceInput apiKey={apiKey} onDraft={handleVoiceDraft} onBusyChange={setIsVoiceBusy} onOpenSettings={onOpenSettings} />

        <fieldset className="workout-fields" disabled={isVoiceBusy}>
          <label>
            Workout name
            <input name="name" value={form.name} onChange={handleChange} required autoFocus />
          </label>
          <div className="workout-form-row">
            <label>
              Type
              <select name="type" value={form.type} onChange={handleChange}>
                <option value="running">Running</option>
                <option value="lifting">Lifting</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Date
              <input name="date" type="date" value={form.date} onChange={handleChange} required />
            </label>
          </div>
          <WorkoutTimeInput value={form.time} timeFormat={timeFormat} onChange={time => setForm(previous => ({ ...previous, time }))} />
          <div className="workout-form-row">
            <label>
              Duration (minutes)
              <input name="durationMinutes" type="number" min="0.01" step="any" value={form.durationMinutes} onChange={handleChange} required />
            </label>
            <label>
              Feeling
              <select name="feeling" value={form.feeling} onChange={handleChange} required>
                <option value="">Choose feeling</option>
                <option value="1">1 — Very bad</option>
                <option value="2">2 — Bad</option>
                <option value="3">3 — Okay</option>
                <option value="4">4 — Good</option>
                <option value="5">5 — Great</option>
              </select>
            </label>
          </div>

          {form.type === 'running' && (
            <label>
              Distance (km)
              <input name="distanceKm" type="number" min="0.01" step="any" value={form.distanceKm} onChange={handleChange} required />
            </label>
          )}

          {form.type === 'lifting' && (
            <div className="exercise-fields">
              {exercises.map((exercise, exerciseIndex) => (
                <fieldset key={exerciseIndex}>
                  <legend>Exercise {exerciseIndex + 1}</legend>
                  <label>
                    Exercise name
                    <input value={exercise.name} onChange={event => updateExercise(exerciseIndex, { name: event.target.value })} required />
                  </label>
                  {exercise.sets.map((set, setIndex) => (
                    <div className="workout-form-row" key={setIndex}>
                      <label>
                        Set {setIndex + 1} reps
                        <input type="number" min="1" step="1" value={set.reps} onChange={event => updateSet(exerciseIndex, setIndex, 'reps', event.target.value)} required />
                      </label>
                      <label>
                        Weight (kg)
                        <input type="number" min="0" step="any" value={set.weightKg} onChange={event => updateSet(exerciseIndex, setIndex, 'weightKg', event.target.value)} required />
                      </label>
                      <button type="button" disabled={exercise.sets.length === 1} aria-label={`Remove set ${setIndex + 1} from exercise ${exerciseIndex + 1}`} onClick={() => updateExercise(exerciseIndex, { sets: exercise.sets.filter((_, i) => i !== setIndex) })}>Remove set</button>
                    </div>
                  ))}
                  <div className="workout-form-actions">
                    <button type="button" onClick={() => updateExercise(exerciseIndex, { sets: [...exercise.sets, { reps: '', weightKg: '' }] })}>Add set</button>
                    <button type="button" disabled={exercises.length === 1} aria-label={`Remove exercise ${exerciseIndex + 1}`} onClick={() => setExercises(previous => previous.filter((_, i) => i !== exerciseIndex))}>Remove exercise</button>
                  </div>
                </fieldset>
              ))}
              <button type="button" onClick={() => setExercises(previous => [...previous, { name: '', sets: [{ reps: '', weightKg: '' }] }])}>Add exercise</button>
            </div>
          )}

          <label>
            Notes (optional)
            <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
          </label>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="workout-form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="save-workout-button" type="submit" disabled={isVoiceBusy}>Save workout</button>
        </div>
      </form>
    </dialog>
  )
}

export default WorkoutForm
