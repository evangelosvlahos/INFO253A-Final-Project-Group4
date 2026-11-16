import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CheckIcon, CloseIcon } from './Icons.jsx'
import './TimeSheet.css'

/** Height of one row on a wheel, in px. Five rows show at a time. Keep in step with the CSS. */
const ROW = 40

const HOURS_12 = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))
const PERIODS = ['AM', 'PM']

/**
 * Pick a time of day on wheels, in a panel under its row: hour, minute and AM/PM
 * on a 12-hour clock, or hour and minute on a 24-hour one.
 * Nothing changes until it's confirmed; closing the panel leaves the time as it was.
 *
 * anchor: the row being edited; the picker opens just under it.
 * value: minutes from midnight to start the wheels on.
 * check: whether a time can be chosen and, when it can't, the reason shown under the wheels.
 */
export function TimeSheet({ title, anchor, value, timeFormat = '12', check, onDone, onClose }) {
  const is24 = timeFormat === '24'
  const [hour, setHour] = useState(is24 ? Math.floor(value / 60) : Math.floor(value / 60) % 12)
  const [minute, setMinute] = useState(value % 60)
  const [period, setPeriod] = useState(value >= 720 ? 1 : 0)

  const minutes = (is24 ? hour : hour + period * 12) * 60 + minute
  const { ok, text } = check(minutes)

  return (
    <WheelSheet title={title} anchor={anchor} ok={ok} note={text} onDone={() => onDone(minutes)} onClose={onClose}>
      <Wheel label="Hour" items={is24 ? HOURS_24 : HOURS_12} index={hour} onChange={setHour} />
      <Wheel label="Minute" items={MINUTES} index={minute} onChange={setMinute} />
      {!is24 && <Wheel label="AM or PM" items={PERIODS} index={period} onChange={setPeriod} />}
    </WheelSheet>
  )
}

/**
 * Pick one value from a short list on a single wheel, in the same panel as the time.
 * `note` is the label under the wheel for whichever row is in the middle.
 */
export function ChoiceSheet({ title, anchor, items, index: initial, note, onDone, onClose }) {
  const [index, setIndex] = useState(initial)
  return (
    <WheelSheet title={title} anchor={anchor} ok note={note(index)} onDone={() => onDone(index)} onClose={onClose}>
      <Wheel label={title} items={items} index={index} onChange={setIndex} />
    </WheelSheet>
  )
}

/** The panel every wheel lives in: cancel, title, confirm, then the wheels. */
function WheelSheet({ title, anchor, ok, note, onDone, onClose, children }) {
  useEffect(() => {
    const onKey = event => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Sit just under the row that opened it, and scroll into view if that runs off the screen.
  const ref = useRef(null)
  useLayoutEffect(() => {
    const element = ref.current
    const parent = element?.offsetParent
    if (!element || !parent || !anchor) return
    element.style.top = `${anchor.getBoundingClientRect().bottom - parent.getBoundingClientRect().top + 8}px`
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' })
  }, [anchor])

  return (
    <>
      <div className="picker-scrim" onClick={onClose} />
      <div ref={ref} className="picker" role="dialog" aria-modal="true" aria-label={title}>
        <div className="time-head">
          <button type="button" className="sheet-close" aria-label="Cancel" onClick={onClose} autoFocus>
            <CloseIcon />
          </button>
          <h2 className="edit-bar-title">{title}</h2>
          <button type="button" className="sheet-close time-done" aria-label="Done" disabled={!ok} onClick={onDone}>
            <CheckIcon />
          </button>
        </div>

        <div className="wheels">
          <span className="wheels-band" aria-hidden="true" />
          {children}
        </div>

        <p className="time-note" role="status">
          {note}
        </p>
      </div>
    </>
  )
}

/** One scrolling column. Whatever row rests in the middle is the value. */
function Wheel({ items, index, label, onChange }) {
  const ref = useRef(null)
  const mounted = useRef(false)

  // Bring the chosen row to the middle: at once on opening, gliding after a tap or key.
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const glide = mounted.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    mounted.current = true
    if (Math.round(element.scrollTop / ROW) !== index) {
      element.scrollTo({ top: index * ROW, behavior: glide ? 'smooth' : 'auto' })
    }
  }, [index])

  const clamp = value => Math.max(0, Math.min(items.length - 1, value))

  return (
    <div
      ref={ref}
      className="wheel"
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={index}
      aria-valuemin={0}
      aria-valuemax={items.length - 1}
      aria-valuetext={items[index]}
      onScroll={event => {
        const next = clamp(Math.round(event.currentTarget.scrollTop / ROW))
        if (next !== index) onChange(next)
      }}
      onKeyDown={event => {
        const to =
          event.key === 'ArrowDown' ? index + 1
          : event.key === 'ArrowUp' ? index - 1
          : event.key === 'Home' ? 0
          : event.key === 'End' ? items.length - 1
          : null
        if (to === null) return
        event.preventDefault()
        onChange(clamp(to))
      }}
    >
      {items.map((item, position) => (
        <span key={item} className={`wheel-row ${position === index ? 'is-on' : ''}`} aria-hidden="true" onClick={() => onChange(position)}>
          {item}
        </span>
      ))}
    </div>
  )
}
