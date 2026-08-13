import { useState } from "react"
import Button from "./Button.jsx"
import "./SearchBar.css"

export default function SearchBar({
  onSubmit,
  placeholder = "Enter Enrollment Number",
  buttonLabel = "View Result",
  label = "Enrollment number",
  autoFocus = false,
}) {
  const [value, setValue] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <form className="searchbar" onSubmit={handleSubmit} role="search">
      <label className="searchbar__label" htmlFor="searchbar-input">
        {label}
      </label>
      <div className="searchbar__row">
        <input
          id="searchbar-input"
          type="text"
          className="searchbar__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <Button type="submit" variant="primary">
          {buttonLabel}
        </Button>
      </div>
    </form>
  )
}
