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
 * How it felt: overlapping flames with the feeling in words beside them ("Felt good").
 * With `explain`, it shows the 1–5 score instead, and tapping (or hovering) says what the number means.
 */
export function FeelScore({ workout, explain = false }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  const felt = FEEL_LABELS[workout.feeling].toLowerCase()
  const flames = (
    <span className="flames" aria-hidden="true">
      <Flame className="back" strokeWidth={2} />
      <Flame className="front" strokeWidth={2} />
    </span>
  )
  const score = (
    <>
      {flames}
      <span className="n" aria-hidden="true">{workout.feeling}</span>
    </>
  )

  // At a glance the word says more than the number: "Felt good", not "4".
  if (!explain) {
    return (
      <span className="feel-score" role="img" aria-label={`Felt ${felt}, ${workout.feeling} of 5`}>
        {flames}
        <span className="n" aria-hidden="true">Felt {felt}</span>
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
