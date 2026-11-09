export function isValidTime(value) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function formatWorkoutTime(value, timeFormat = '12') {
  if (!isValidTime(value)) throw new Error('Workout time must be HH:mm.')
  if (timeFormat === '24') return value
  const [hour, minute] = value.split(':')
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) >= 12 ? 'PM' : 'AM'}`
}
