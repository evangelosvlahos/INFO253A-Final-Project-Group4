import menuIcon from '../assets/menu_icon.png'
import searchIcon from '../assets/search_icon.png'
import { Moon, Sun } from 'lucide-react'

function Header({ theme, onToggleTheme, onLogWorkout, onOpenSettings }) {
  return (
    <header className="site-header">
      <img src={menuIcon} alt="Menu" />
      <button className="log-workout-button mobile-log-button" type="button" onClick={onLogWorkout} aria-haspopup="dialog">
        + Log workout
      </button>
      <div className="search-box">
        <img src={searchIcon} alt="" />
        <input type="text" placeholder="Quick Find" aria-label="Quick Find" disabled />
      </div>
      <div className="iampadding"></div>
      {/* One tap flips the theme; the icon shows the theme it will switch to. */}
      <button className="icon-btn" type="button" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
        {theme === 'dark' ? <Sun strokeWidth={1.75} aria-hidden="true" /> : <Moon strokeWidth={1.75} aria-hidden="true" />}
      </button>
      <button className="header-settings-button" type="button" onClick={onOpenSettings} aria-haspopup="dialog">Settings</button>
    </header>
  )
}

export default Header
