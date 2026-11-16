import { ChartIcon, DumbbellIcon, HomeIcon, PlusIcon } from './Icons.jsx'
import './Nav.css'

const ITEMS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'workouts', label: 'Workouts', Icon: DumbbellIcon },
  { id: 'stats', label: 'Stats', Icon: ChartIcon },
]

/** A floating pill of tabs, and the button that logs a workout on its own beside it. */
function Nav({ tab, onChange, onLog }) {
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
      <button className="nav-log" type="button" aria-label="Log a workout" aria-haspopup="dialog" onClick={onLog}>
        <PlusIcon />
      </button>
    </nav>
  )
}

export default Nav
