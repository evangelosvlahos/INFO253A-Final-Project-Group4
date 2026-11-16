import { fmtMinutes } from './dates.jsx'

/* What a workout says about itself: its labels, headline numbers and one-line description. */

/** How it felt, 1 to 5. */
export const FEEL_LABELS = { 1: 'Drained', 2: 'Heavy', 3: 'Steady', 4: 'Good', 5: 'Strong' }

export const ALL_FEELS = [1, 2, 3, 4, 5]

/** "1 point", "4 points" */
export const points = feeling => `${feeling} ${feeling === 1 ? 'point' : 'points'}`

export const TYPE_LABELS = { running: 'Run', lifting: 'Lift', yoga: 'Yoga', walking: 'Walk', other: 'Other' }

/** The exercises of a lifting workout; none for any other type. */
export function exercisesOf(workout) {
  return workout.type === 'lifting' ? workout.data?.exercises ?? [] : []
}

/** How far, for workouts that cover ground; undefined otherwise. */
export function distanceOf(workout) {
  return workout.data?.distanceKm || undefined
}

/** Sets and reps, counted from the set-by-set log. */
export function totals(workout) {
  const sets = exercisesOf(workout).flatMap(exercise => exercise.sets)
  return { sets: sets.length, reps: sets.reduce((count, set) => count + set.reps, 0) }
}

/** "5:58 /km" */
export function fmtPace(durationMinutes, km) {
  const seconds = Math.round((durationMinutes * 60) / km)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} /km`
}

/**
 * The headline numbers, which depend on what kind of workout it was:
 * lifting shows sets and reps, a run shows distance and pace,
 * anything else (yoga) shows only how long it took.
 * How it felt is said beside the flames, so it isn't repeated here.
 */
export function statsOf(workout) {
  const stats = [{ k: 'Duration', v: fmtMinutes(workout.durationMinutes) }]
  const { sets, reps } = totals(workout)
  const km = distanceOf(workout)
  if (km) {
    stats.push({ k: 'Distance', v: `${km} km` })
    stats.push({ k: 'Pace', v: fmtPace(workout.durationMinutes, km) })
  } else {
    if (sets) stats.push({ k: 'Sets', v: String(sets) })
    if (reps) stats.push({ k: 'Reps', v: String(reps) })
  }
  return stats.slice(0, 3)
}

/**
 * One short line from the notes: the opening clause, before the
 * "felt…" and other asides, capitalised and kept to a line's worth.
 */
export function shortDescription(text, max = 56) {
  const clean = text.replace(/\s+/g, ' ').trim()
  const clauses = clean.split(/\s*[,.;!?–—]\s+|\s+(?:felt|feeling|and it was|it was)\s+/i)
  let line = clauses[0]
  // "Strength day" alone only repeats the name, so keep what follows it too.
  if (line.split(' ').length <= 2 && clauses[1]) line = `${line}, ${clauses[1]}`
  if (line.length < 4) line = clean
  if (line.length > max) line = `${line.slice(0, line.lastIndexOf(' ', max) > 20 ? line.lastIndexOf(' ', max) : max)}…`
  return line.charAt(0).toUpperCase() + line.slice(1)
}

/** The one-line description: from the notes, else the exercises, else the type. */
export function describe(workout) {
  if (workout.notes) return shortDescription(workout.notes)
  const exercises = exercisesOf(workout)
  if (exercises.length) return exercises.map(exercise => exercise.name).join(', ')
  return TYPE_LABELS[workout.type] ?? null
}
