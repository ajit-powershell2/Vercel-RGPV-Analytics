import "./StatGrid.css"

export default function StatGrid({ columns = 4, children }) {
  return (
    <div className="stat-grid" data-columns={columns}>
      {children}
    </div>
  )
}
