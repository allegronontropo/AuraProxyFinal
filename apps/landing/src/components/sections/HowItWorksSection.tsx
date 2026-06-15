import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { HOW_IT_WORKS } from '../../lib/content'
import { revealSectionHeader, animateSVGPaths, typewriterEffect } from '../../lib/animations'

const DOCKER_LINES = [
  '$ docker compose up -d',
  '',
  '✔ postgres started',
  '✔ redis started',
  '✔ aura-proxy started',
  '',
  '→ Proxy listening on http://localhost:3000',
  '→ Swagger UI at http://localhost:3000/api',
  '',
  '$ curl localhost:3000/v1/chat/completions \\',
  '  -H "X-API-Key: ap_proj_xxxxx" \\',
  '  -d \'{"model":"gpt-4o-mini","messages":[...]}\'',
  '',
  '{ "cached": false, "latency_ms": 412, ... }',
  '{ "cached": true,  "latency_ms": 3, ... }   ← CACHE HIT ✓',
]

export function HowItWorksSection() {
  const sectionRef  = useRef<HTMLElement>(null)
  const svgRef      = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (sectionRef.current)  revealSectionHeader(sectionRef.current)
    if (svgRef.current)      animateSVGPaths('#how-it-works-diagram')
    if (terminalRef.current) typewriterEffect(terminalRef.current, DOCKER_LINES, { speed: 30 })
  }, [])

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="section how-section"
      aria-labelledby="how-heading"
    >
      <div className="container">
        {/* Header */}
        <div className="section-header">
          <span className="overline section-overline">{HOW_IT_WORKS.overline}</span>
          <h2
            id="how-heading"
            className="section-headline"
            style={{ opacity: 0 }}
          >
            {HOW_IT_WORKS.headline.split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br/>}</span>
            ))}
          </h2>
          <p className="section-body" style={{ opacity: 0 }}>
            {HOW_IT_WORKS.body}
          </p>
        </div>

        {/* Steps grid */}
        <div className="how-steps">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <motion.div
              key={step.step}
              className="how-step"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="step-number" aria-hidden="true">{step.step}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Terminal */}
        <motion.div
          className="terminal-wrap"
          initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Terminal demo"
        >
          <div className="terminal-topbar" aria-hidden="true">
            <span className="topbar-dot red"   />
            <span className="topbar-dot amber" />
            <span className="topbar-dot green" />
            <span className="terminal-title">Terminal</span>
          </div>
          <pre
            ref={terminalRef}
            className="terminal-body"
            aria-label="Docker compose demo output"
          />
        </motion.div>
      </div>
    </section>
  )
}
