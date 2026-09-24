import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { Analytics as VercelAnalytics } from "@vercel/analytics/react"
import Navbar from "./components/Navbar.jsx"
import Footer from "./components/Footer.jsx"
import Overview from "./pages/Overview.jsx"
import Toppers from "./pages/Toppers.jsx"
import FailedStudents from "./pages/FailedStudents.jsx"
import Analytics from "./pages/Analytics.jsx"
import Search from "./pages/Search.jsx"
import Student from "./pages/Student.jsx"

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/toppers" element={<Toppers />} />
          <Route path="/failed" element={<FailedStudents />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/search" element={<Search />} />
          <Route path="/student/:enrollment" element={<Student />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </main>
      <Footer />
      <VercelAnalytics />
    </>
  )
}
