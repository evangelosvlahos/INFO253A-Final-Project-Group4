import { useEffect, useRef, useState } from 'react'
import { formatWorkoutTime } from '../utils/time.jsx'

function Settings({ preferences, onSave, onClose }) {
  const dialogRef = useRef(null)
  const [theme, setTheme] = useState(preferences.theme)
  const [timeFormat, setTimeFormat] = useState(preferences.timeFormat)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    onSave({ preferences: { theme, timeFormat } })
  }

  return (
    <dialog ref={dialogRef} className="workout-dialog" aria-labelledby="settings-title" onCancel={onClose}>
      <form className="workout-form" onSubmit={handleSubmit}>
        <h1 id="settings-title">Settings</h1>
        <label>
          Theme
          <select value={theme} onChange={event => setTheme(event.target.value)} autoFocus>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Time format
          <select value={timeFormat} onChange={event => setTimeFormat(event.target.value)}>
            <option value="12">12-hour</option>
            <option value="24">24-hour</option>
          </select>
        </label>
        <p>Time preview: {formatWorkoutTime('13:30', timeFormat)}</p>
        <div className="workout-form-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="save-workout-button" type="submit">Save settings</button>
        </div>
      </form>
    </dialog>
  )
}

export default Settings
