/* Small pieces the log and edit forms share. */

/** Keep only digits, for whole numbers typed as text. */
export const digits = value => value.replace(/\D/g, '')

/** Keep digits and one decimal point. */
export const decimal = value => value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')

/** Open the native date picker on click, where the browser lets us (desktop needs the nudge). */
export function openPicker(event) {
  try {
    event.currentTarget.showPicker?.()
  } catch {
    /* not allowed here: the field still works by focus */
  }
}

/** A number you can type over, sized to its content so it sits in a line of text. */
function NumInput({ value, unit, label, onChange }) {
  return (
    <span className="edit-num is-editable">
      <input
        inputMode="decimal"
        value={value}
        placeholder="0"
        aria-label={label}
        style={{ width: `${Math.max(1, value.length)}ch` }}
        onChange={event => onChange(event.target.value)}
      />
      {unit && <span aria-hidden="true"> {unit}</span>}
    </span>
  )
}

export default NumInput
