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
