import { NavLink, Link } from "react-router-dom"
import ThemeToggle from "./ThemeToggle.jsx"
import "./Navbar.css"

const LINKS = [
  { to: "/overview", label: "Overview" },
  { to: "/toppers", label: "Toppers" },
  { to: "/failed", label: "Failed Students" },
  { to: "/analytics", label: "Analytics" },
  { to: "/search", label: "Search" },
]

export default function Navbar() {
  return (
    <header className="nav">
      <div className="wrap nav__inner">
        <Link to="/overview" className="brand">
          <span className="brand__mark" aria-hidden="true">
            R
          </span>
          <span className="brand__text">
            RGPV <span className="brand__thin">Result Analytics</span>
          </span>
        </Link>

        <nav className="nav__desktop" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav__link${isActive ? " nav__link--active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle: sits at the far right of the header on desktop
            (after the nav) and opposite the brand on mobile. */}
        <div className="nav__toggle">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile-only: a horizontal, scrollable strip of links below the brand
          row. Replaces the hamburger dropdown; hidden entirely on desktop. */}
      <nav className="nav__mobile" aria-label="Primary mobile">
        <div className="wrap nav__mobile-track">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav__mobile-link${isActive ? " nav__mobile-link--active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}
