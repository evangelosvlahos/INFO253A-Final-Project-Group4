export function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function formatWorkoutTime(value, timeFormat = '12') {
  if (!isValidTime(value)) throw new Error('Workout time must be HH:mm.')
  if (timeFormat === '24') return value
  const [hour, minute] = value.split(':')
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? 'PM' : 'AM'}`
}

/** The time without AM or PM, for tight spots: "6:12" in 12-hour, "18:12" in 24-hour. */
export function formatShortTime(value, timeFormat = '12') {
  return formatWorkoutTime(value, timeFormat).replace(/ [AP]M$/, '')
}

/** A time some minutes later (or earlier), kept inside the same day. */
export function addMinutes(value, count) {
  const [hour, minute] = value.split(':').map(Number)
  const total = Math.max(0, Math.min(23 * 60 + 59, hour * 60 + minute + count))
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
