/* Date helpers. Dates are local-time day strings, YYYY-MM-DD, as stored on a workout. */

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function fromISODate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function today() {
  return toISODate(new Date())
}

export function addDays(value, count) {
  const date = fromISODate(value)
  date.setDate(date.getDate() + count)
  return toISODate(date)
}

/** Whole days from a to b. */
export function daysBetween(a, b) {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000)
}

/** The Monday of the week a day falls in. */
export function startOfWeek(value) {
  const date = fromISODate(value)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return toISODate(date)
}

export function startOfMonth(value) {
  const date = fromISODate(value)
  return toISODate(new Date(date.getFullYear(), date.getMonth(), 1))
}

export function daysInMonth(value) {
  const date = fromISODate(value)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** "Fri 13 Nov" */
export function fmtShort(value) {
  const date = fromISODate(value)
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

/** "Friday, Nov 13" */
export function fmtDayTitle(value) {
  const date = fromISODate(value)
  return `${WEEKDAYS_LONG[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`
}

/** "Fri, Nov 13": the same title where there isn't room for the whole weekday. */
export function fmtDayTitleShort(value) {
  return `${WEEKDAYS[fromISODate(value).getDay()]}, ${fmtMonthDay(value)}`
}

/** "Nov 13" */
export function fmtMonthDay(value) {
  const date = fromISODate(value)
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

/** "Wed" inside the last week, "Nov 4" before that. */
export function fmtDayShort(value) {
  const count = daysBetween(value, today())
  if (count === 0) return 'Today'
  if (count > 0 && count < 7) return WEEKDAYS[fromISODate(value).getDay()]
  return fmtMonthDay(value)
}

/** "Today", "Yesterday", "3 days ago". */
export function daysAgo(value) {
  const count = daysBetween(value, today())
  return count <= 0 ? 'Today' : count === 1 ? 'Yesterday' : `${count} days ago`
}

/** "48 min", "1h 15m" */
export function fmtMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}
