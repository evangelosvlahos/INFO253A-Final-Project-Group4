import menuIcon from '../assets/menu_icon.png'
import searchIcon from '../assets/search_icon.png'
import checkIcon from '../assets/check_icon.png'

function Header() {
  return (
    <header className="site-header">
      <img src={menuIcon} alt="Menu" />
      <div className="search-box">
        <img src={searchIcon} alt="" />
        <input type="text" placeholder="Quick Find" aria-label="Quick Find" disabled />
      </div>
      <div className="iampadding"></div>
      <div className="task-counter">
        <img src={checkIcon} alt="" /> Fitness Log
      </div>
    </header>
  )
}

export default Header
