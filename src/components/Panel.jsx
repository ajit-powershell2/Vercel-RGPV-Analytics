import "./Panel.css"

export default function Panel({ className = "", children, ...rest }) {
  return (
    <div className={`panel ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="panel__header">
      <div>
        <h3 className="panel__title">{title}</h3>
        {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="panel__action">{action}</div> : null}
    </div>
  )
}
