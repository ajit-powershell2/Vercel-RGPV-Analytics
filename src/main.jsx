import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, matchPath, useLocation } from "react-router-dom"
import { Analytics } from "@vercel/analytics/react"
import App from "./App.jsx"
import "./styles/global.css"

function WebAnalytics() {
  const { pathname } = useLocation()
  // Track hash-router pages without sending individual enrollment numbers.
  const path = matchPath("/student/:enrollment", pathname)
    ? "/student/:enrollment"
    : pathname

  return (
    <Analytics
      route={path}
      path={path}
      mode={import.meta.env.DEV ? "development" : "production"}
    />
  )
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
      <WebAnalytics />
    </HashRouter>
  </StrictMode>,
)
