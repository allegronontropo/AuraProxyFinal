import { useEffect, useRef } from 'react'
import { NAV_LINKS, GITHUB_URL } from '../../lib/content'
import { addMagneticEffect, initNavScroll } from '../../lib/animations'

export function NavBar() {
  const navRef = useRef<HTMLElement>(null)
  const primaryBtnRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (navRef.current) initNavScroll(navRef.current)
    if (primaryBtnRef.current) addMagneticEffect(primaryBtnRef.current)
  }, [])

  return (
    <header
      ref={navRef}
      className="navbar"
      data-scrolled="false"
      role="banner"
    >
      <nav className="navbar-inner container" aria-label="Main navigation">
        {/* Logo */}
        <a href="/" className="navbar-logo" aria-label="Aura Proxy home">
          <span className="navbar-logo-mark">◈</span>
          <span className="navbar-logo-text">Aura Proxy</span>
        </a>

        {/* Links */}
        <ul className="navbar-links" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="navbar-link">{link.label}</a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="navbar-actions">
          <a
            href={GITHUB_URL}
            className="navbar-github"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
          >
            <GitHubIcon />
            <span>Star</span>
          </a>
          <a
            ref={primaryBtnRef}
            href="#features"
            className="btn btn-primary btn-sm"
          >
            Get Started
          </a>
        </div>
      </nav>
    </header>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}
