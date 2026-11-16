/** A quiet card for when there is nothing to show yet. */
function EmptyState({ title, body }) {
  return (
    <div className="panel rise">
      <h2 className="panel-title">{title}</h2>
      <p className="panel-sub">{body}</p>
    </div>
  )
}

export default EmptyState
