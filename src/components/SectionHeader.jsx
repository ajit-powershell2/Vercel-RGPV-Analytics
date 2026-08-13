import "./SectionHeader.css"

export default function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="section-header">
      <div className="section-header__text">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="section-header__title">{title}</h1>
        {subtitle ? <p className="section-header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  )
}
