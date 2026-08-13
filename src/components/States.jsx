import "./States.css"

export function Skeleton({ height = 80, radius = "var(--r-sm)", className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height, borderRadius: radius }}
      aria-hidden="true"
    />
  )
}

export function SkeletonGrid({ count = 4, height = 96 }) {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} radius="var(--r-md)" />
      ))}
    </div>
  )
}

export function StateBlock({ title, message, action, tone = "neutral" }) {
  return (
    <div className={`state-block state-block--${tone}`} role="status">
      {title ? <h3 className="state-block__title">{title}</h3> : null}
      {message ? <p className="state-block__message">{message}</p> : null}
      {action ? <div className="state-block__action">{action}</div> : null}
    </div>
  )
}
