import { ChartIcon, CheckIcon, DumbbellIcon, HomeIcon, MicIcon, PlusIcon } from './Icons.jsx'
import './Nav.css'

const ITEMS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'workouts', label: 'Workouts', Icon: DumbbellIcon },
  { id: 'stats', label: 'Stats', Icon: ChartIcon },
]

/**
 * A floating pill of tabs, and the round button on its own beside it.
 * `mic` is present only while the Log screen is open: { mode, onPress },
 * where mode is 'idle', 'listening' or 'disabled'.
 */
function Nav({ tab, onChange, mic }) {
  const onLog = tab === 'log' && mic
  const mode = onLog ? mic.mode : 'idle'

  return (
    <nav className="nav" aria-label="Primary">
      <div className="nav-pill">
        {ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="nav-item"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`nav-log ${mode === 'listening' ? 'is-listening' : ''} ${mode === 'disabled' ? 'is-disabled' : ''}`}
        aria-label={mode === 'listening' ? 'Done listening' : tab === 'log' ? 'Start listening' : 'Log a workout'}
        aria-current={tab === 'log' ? 'page' : undefined}
        disabled={mode === 'disabled'}
        onClick={() => (onLog ? mic.onPress() : onChange('log'))}
      >
        {/* A plus everywhere; on the Log form it turns into the mic that fills the form in. */}
        {tab !== 'log' ? <PlusIcon /> : mode === 'listening' ? <CheckIcon /> : <MicIcon />}
      </button>
    </nav>
  )
}

export default Nav
