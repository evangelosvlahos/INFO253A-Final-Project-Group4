import { useId, useState } from 'react'
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
 * How it felt: overlapping flames with the 1–5 score beside them.
 * With `explain`, tapping (or hovering) it says what the number means.
 */
export function FeelScore({ workout, explain = false }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const felt = FEEL_LABELS[workout.feeling].toLowerCase()
  const score = (
    <>
      <span className="flames" aria-hidden="true">
        <Flame className="back" strokeWidth={2} />
        <Flame className="front" strokeWidth={2} />
      </span>
      <span className="n" aria-hidden="true">{workout.feeling}</span>
    </>
  )

  if (!explain) {
    return (
      <span className="feel-score" role="img" aria-label={`Felt ${felt}, ${workout.feeling} of 5`} title={`Felt ${felt}`}>
        {score}
      </span>
    )
  }

  return (
    <span className={`feel-tip-wrap${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="feel-score"
        aria-label={`Felt ${felt}, ${workout.feeling} of 5. What does this mean?`}
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
        onBlur={() => setOpen(false)}
        onKeyDown={event => event.key === 'Escape' && setOpen(false)}
      >
        {score}
      </button>
      <span className="feel-tip" role="tooltip" id={tipId}>
        Felt {felt}
      </span>
    </span>
  )
}
