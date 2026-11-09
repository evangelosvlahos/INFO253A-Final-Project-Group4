import menuIcon from '../assets/menu_icon.png'
import searchIcon from '../assets/search_icon.png'

function Header({ onLogWorkout, onOpenSettings }) {
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
      <button className="header-settings-button" type="button" onClick={onOpenSettings} aria-haspopup="dialog">Settings</button>
    </header>
  )
}

export default Header
