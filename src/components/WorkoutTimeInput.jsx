import { useEffect, useRef, useState } from 'react'
import { isValidTime } from '../utils/time.jsx'

function timeParts(value, timeFormat) {
  if (!isValidTime(value)) return { hour: '', minute: '', period: '' }
  const [hour, minute] = value.split(':')
  return {
    hour: timeFormat === '24' ? hour : String(Number(hour) % 12 || 12),
    minute,
    period: Number(hour) >= 12 ? 'PM' : 'AM',
  }
}

function WorkoutTimeInput({ value, timeFormat = '12', onChange }) {
  const [parts, setParts] = useState(() => timeParts(value, timeFormat))
  const lastValue = useRef(value)
  const lastFormat = useRef(timeFormat)

  useEffect(() => {
    if (lastValue.current !== value || lastFormat.current !== timeFormat) setParts(timeParts(value, timeFormat))
    lastValue.current = value
    lastFormat.current = timeFormat
  }, [value, timeFormat])

  function handleChange(event) {
    const next = { ...parts, [event.target.name]: event.target.value }
    setParts(next)
    if (next.hour === '' || next.minute === '' || (timeFormat === '12' && next.period === '')) {
      lastValue.current = ''
      onChange('')
      return
    }
    const hour = timeFormat === '24' ? Number(next.hour) : Number(next.hour) % 12 + (next.period === 'PM' ? 12 : 0)
    const time = `${String(hour).padStart(2, '0')}:${next.minute}`
    lastValue.current = time
    onChange(time)
  }

  return (
    <fieldset className="time-input">
      <legend>Start time</legend>
      <div className="workout-form-row">
        <label>
          Hour
          <select name="hour" value={parts.hour} onChange={handleChange} required>
            <option value="">Hour</option>
            {Array.from({ length: timeFormat === '24' ? 24 : 12 }, (_, i) => {
              const hour = timeFormat === '24' ? String(i).padStart(2, '0') : String(i + 1)
              return <option key={hour} value={hour}>{hour}</option>
            })}
          </select>
        </label>
        <label>
          Minute
          <select name="minute" value={parts.minute} onChange={handleChange} required>
            <option value="">Minute</option>
            {Array.from({ length: 60 }, (_, i) => {
              const minute = String(i).padStart(2, '0')
              return <option key={minute} value={minute}>{minute}</option>
            })}
          </select>
        </label>
        {timeFormat === '12' && (
          <label>
            AM/PM
            <select name="period" value={parts.period} onChange={handleChange} required>
              <option value="">AM/PM</option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </label>
        )}
      </div>
    </fieldset>
  )
}

export default WorkoutTimeInput
