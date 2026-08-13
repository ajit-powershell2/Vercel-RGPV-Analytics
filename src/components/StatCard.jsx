import "./StatCard.css"

export default function StatCard({ label, value, tone = "default", hint }) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </div>
  )
}
