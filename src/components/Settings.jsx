import { useState } from 'react'
import { formatWorkoutTime } from '../utils/time.jsx'
import { ChevronLeft, ChevronRight, ClockIcon, KeyIcon } from './Icons.jsx'
import { ChoiceSheet } from './TimeSheet.jsx'
import './WorkoutDetail.css'
import './Log.css'
import './Settings.css'

const TIME_FORMATS = [
  { id: '12', label: '12-hour' },
  { id: '24', label: '24-hour' },
]

/**
 * Settings, on a screen of its own and laid out like the edit screen:
 * back on the left, Save on the right, one row for each thing you can change.
 * Going back leaves everything as it was.
 */
function Settings({ apiKey, preferences, onSave, onClose }) {
  const [key, setKey] = useState(apiKey)
  const [timeFormat, setTimeFormat] = useState(preferences.timeFormat)
  /** The row the wheel belongs to while it's open, so it can sit just under it. */
  const [anchor, setAnchor] = useState(null)
  const formatLabel = TIME_FORMATS.find(option => option.id === timeFormat).label

  function save() {
    onSave({ apiKey: key.trim(), preferences: { ...preferences, timeFormat } })
  }

  return (
    <section className="screen edit" aria-labelledby="settings-title">
      <div className="edit-bar">
        <button type="button" className="detail-back" aria-label="Back" onClick={onClose}>
          <ChevronLeft />
        </button>
        <h1 className="edit-bar-title" id="settings-title">Settings</h1>
        <button type="button" className="edit-save" onClick={save}>
          Save
        </button>
      </div>

      <div className="props set-props">
        {/* The same wheel as the times and "How it felt", with the two formats on it. */}
        <button
          type="button"
          className="prop"
          aria-haspopup="dialog"
          aria-expanded={anchor !== null}
          onClick={event => setAnchor(event.currentTarget)}
        >
          <ClockIcon className="prop-icon" aria-hidden="true" />
          <span className="k">Time format</span>
          <span className="v">{formatLabel}</span>
          <ChevronRight className="prop-chev" aria-hidden="true" />
        </button>

        {/* The key is typed straight into its row. */}
        <label className="prop">
          <KeyIcon className="prop-icon" aria-hidden="true" />
          <span className="k set-key">
            <input
              type="password"
              value={key}
              onChange={event => setKey(event.target.value)}
              placeholder="Gemini API key"
              aria-label="Gemini API key"
              autoComplete="off"
              spellCheck={false}
            />
          </span>
        </label>
      </div>

      <p className="log-hint">
        The key fills the log form from your voice. It is kept in memory until you reload this page;
        a browser-only app cannot keep API keys fully secret.{' '}
        <a className="set-link" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer noopener">
          Get a Gemini API key
        </a>
      </p>

      <div style={{ flex: 1 }} />

      {key && (
        <div className="vc-actions">
          <button type="button" className="vc-discard" onClick={() => setKey('')}>
            Clear key
          </button>
        </div>
      )}

      {anchor && (
        <ChoiceSheet
          title="Time format"
          anchor={anchor}
          items={TIME_FORMATS.map(option => option.label)}
          index={TIME_FORMATS.findIndex(option => option.id === timeFormat)}
          note={index => `Times show as ${formatWorkoutTime('13:30', TIME_FORMATS[index].id)}`}
          onDone={index => {
            setTimeFormat(TIME_FORMATS[index].id)
            setAnchor(null)
          }}
          onClose={() => setAnchor(null)}
        />
      )}
    </section>
  )
}

export default Settings
