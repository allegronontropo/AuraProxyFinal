import { FOOTER, GITHUB_URL } from '../../lib/content'

export function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <a href="/" className="footer-logo" aria-label="Aura Proxy home">
            <span className="navbar-logo-mark">◈</span>
            <span>Aura Proxy</span>
          </a>
          <p className="footer-tagline">{FOOTER.tagline}</p>
          <a
            href={GITHUB_URL}
            className="footer-github-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
          >
            GitHub →
          </a>
        </div>

        {/* Link columns */}
        {FOOTER.columns.map((col) => (
          <div key={col.heading} className="footer-col">
            <h3 className="footer-col-heading">{col.heading}</h3>
            <ul role="list">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="footer-link">{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} Aura Proxy. Open-source under MIT.</p>
        </div>
      </div>
    </footer>
  )
}
