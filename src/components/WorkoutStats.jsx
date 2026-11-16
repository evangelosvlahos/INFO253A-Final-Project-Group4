import { Flame } from 'lucide-react'
import { FEEL_LABELS, statsOf } from '../utils/workout.jsx'

/** Up to three headline numbers: big label, small value. */
export function WorkoutStats({ workout }) {
  return (
    <span className="day-stats">
      {statsOf(workout).map(stat => (
        <span key={stat.k}>
          <span className="k">{stat.k}</span>
          <span className="v">{stat.v}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * How it felt: overlapping flames with the feeling in words beside them.
 * At a glance the word says more than the 1–5 score: "Felt good", not "4".
 */
export function FeelScore({ workout }) {
  const felt = FEEL_LABELS[workout.feeling].toLowerCase()
  return (
    <span className="feel-score" role="img" aria-label={`Felt ${felt}, ${workout.feeling} of 5`}>
      <span className="flames" aria-hidden="true">
        <Flame className="back" strokeWidth={2} />
        <Flame className="front" strokeWidth={2} />
      </span>
      <span className="n" aria-hidden="true">Felt {felt}</span>
    </span>
  )
}
