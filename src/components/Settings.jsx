import { useEffect, useRef, useState } from 'react'
import { formatWorkoutTime } from '../utils/time.jsx'

function Settings({ apiKey, preferences, onSave, onClose }) {
  const dialogRef = useRef(null)
  const [key, setKey] = useState(apiKey)
  const [theme, setTheme] = useState(preferences.theme)
  const [timeFormat, setTimeFormat] = useState(preferences.timeFormat)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog.showModal()
    return () => dialog.close()
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    onSave({ apiKey: key.trim(), preferences: { theme, timeFormat } })
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
        <label>
          Gemini API key
          <input type="password" value={key} onChange={event => setKey(event.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <p>Kept in memory until you reload this page. A browser-only app cannot keep API keys fully secret.</p>
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer noopener">Get a Gemini API key</a>
        <div className="workout-form-actions">
          <button type="button" onClick={() => setKey('')}>Clear key</button>
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="save-workout-button" type="submit">Save settings</button>
        </div>
      </form>
    </dialog>
  )
}

export default Settings
