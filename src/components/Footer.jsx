import "./Footer.css"

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <p className="footer__brand">RGPV Result Analytics</p>
        <p className="disclaimer">
          Shows only enrollments already scraped and stored in the database.
          Rankings and percentiles are computed among analyzed students, not
          official RGPV merit lists.
        </p>
      </div>
    </footer>
  )
}
