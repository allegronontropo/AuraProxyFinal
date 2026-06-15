import { motion } from 'framer-motion'
import { DEPLOY } from '../../lib/content'
import { useEffect, useRef } from 'react'
import { typewriterEffect } from '../../lib/animations'

export function DeploySection() {
  const termRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (termRef.current) {
      typewriterEffect(termRef.current, DEPLOY.dockerCompose.split('\n'), { speed: 20 })
    }
  }, [])

  return (
    <section
      id="deploy"
      className="section deploy-section"
      aria-labelledby="deploy-heading"
    >
      <div className="container deploy-container">
        {/* Text */}
        <motion.div
          className="deploy-text"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="overline">{DEPLOY.overline}</span>
          <h2 id="deploy-heading" className="section-headline">
            {DEPLOY.headline.split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br/>}</span>
            ))}
          </h2>
          <p className="deploy-body">{DEPLOY.body}</p>
          <a
            href={DEPLOY.cta.href}
            className="btn btn-primary btn-lg"
            id="deploy-cta"
            target="_blank"
            rel="noopener noreferrer"
          >
            {DEPLOY.cta.label}
            <span className="btn-arrow" aria-hidden="true">→</span>
          </a>
        </motion.div>

        {/* docker-compose block */}
        <motion.div
          className="deploy-code-wrap"
          initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          aria-label="docker-compose.yml example"
        >
          <div className="code-header" aria-hidden="true">
            <div className="code-dots">
              <span className="topbar-dot red"   />
              <span className="topbar-dot amber" />
              <span className="topbar-dot green" />
            </div>
            <span className="code-filename">docker-compose.yml</span>
            <button
              className="code-copy"
              aria-label="Copy docker-compose.yml"
              onClick={() => navigator.clipboard.writeText(DEPLOY.dockerCompose)}
            >
              Copy
            </button>
          </div>
          <pre
            ref={termRef}
            className="code-body"
            aria-label="docker compose configuration"
          />
        </motion.div>
      </div>
    </section>
  )
}
