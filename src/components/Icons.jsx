import {
  CalendarDays, ChartNoAxesColumn, Check, ChevronLeft as LChevronLeft, ChevronRight as LChevronRight,
  CircleGauge, Clock, Dumbbell, Flame, House, KeyRound, Layers, List, Mic, Moon, Plus, Repeat, Route, Settings, Sun, X,
} from 'lucide-react'
import runUrl from '../assets/workout-icons/running.png'
import liftUrl from '../assets/workout-icons/weightlift.png'
import benchUrl from '../assets/workout-icons/bench-press.png'
import squatUrl from '../assets/workout-icons/squats.png'
import yogaUrl from '../assets/workout-icons/yoga.png'
import walkUrl from '../assets/workout-icons/walking.png'
import { exercisesOf } from '../utils/workout.jsx'

/** Interface icons come from Lucide, with one shared stroke weight. */
function wrap(Icon) {
  return function AppIcon(props) {
    return <Icon strokeWidth={1.75} aria-hidden="true" {...props} />
  }
}

export const HomeIcon = wrap(House)
export const DumbbellIcon = wrap(Dumbbell)
/** Stats tab. */
export const ChartIcon = wrap(ChartNoAxesColumn)
export const PlusIcon = wrap(Plus)
export const SunIcon = wrap(Sun)
export const MoonIcon = wrap(Moon)
export const SettingsIcon = wrap(Settings)
export const CalendarIcon = wrap(CalendarDays)
/** The list side of the view toggle. */
export const MenuIcon = wrap(List)
export const ChevronLeft = wrap(LChevronLeft)
export const ChevronRight = wrap(LChevronRight)
export const CloseIcon = wrap(X)
export const MicIcon = wrap(Mic)
export const CheckIcon = wrap(Check)
export const ClockIcon = wrap(Clock)
export const FlameIcon = wrap(Flame)
export const SetsIcon = wrap(Layers)
export const RepsIcon = wrap(Repeat)
export const DistanceIcon = wrap(Route)
export const PaceIcon = wrap(CircleGauge)
export const KeyIcon = wrap(KeyRound)

/* ---------- workout types ---------- */

/* Filled activity figures in the Apple Fitness style, from Icons8 (iOS Glyph set).
   They're drawn as a mask, so each one takes the text colour of wherever it sits. */

const TYPE_GLYPHS = {
  running: runUrl,
  lifting: liftUrl,
  yoga: yogaUrl,
  walking: walkUrl,
  other: walkUrl,
}

function glyphFor(workout) {
  if (workout.type === 'lifting') {
    const what = `${exercisesOf(workout)[0]?.name ?? ''} ${workout.name}`.toLowerCase()
    if (/bench|push|chest/.test(what)) return benchUrl
    if (/squat|leg/.test(what)) return squatUrl
  }
  return TYPE_GLYPHS[workout.type] ?? walkUrl
}

/** Activity figure for a workout: by type, and for lifting by the lift itself. */
export function WorkoutIcon({ workout }) {
  const mask = `url(${glyphFor(workout)})`
  return <span className="glyph" aria-hidden="true" style={{ maskImage: mask, WebkitMaskImage: mask }} />
}
