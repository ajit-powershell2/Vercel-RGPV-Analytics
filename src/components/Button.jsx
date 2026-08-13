import "./Button.css"

export default function Button({
  as = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  const Tag = as
  const classes = ["btn", `btn--${variant}`, `btn--${size}`, className]
    .filter(Boolean)
    .join(" ")
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  )
}
