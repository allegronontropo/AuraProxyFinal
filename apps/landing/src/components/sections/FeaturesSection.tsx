import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FEATURES } from '../../lib/content'
import { revealSectionHeader, addCardHoverGlow } from '../../lib/animations'

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRefs   = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (sectionRef.current) revealSectionHeader(sectionRef.current)
    cardRefs.current.forEach((card) => {
      if (card) addCardHoverGlow(card)
    })
  }, [])

  return (
    <section
      id="features"
      ref={sectionRef}
      className="section features-section"
      aria-labelledby="features-heading"
    >
      <div className="container">
        {/* Section header */}
        <div className="section-header">
          <span className="overline section-overline">Features</span>
          <h2
            id="features-heading"
            className="section-headline"
            style={{ opacity: 0 }}
          >
            Everything your LLM layer<br/>
            was missing.
          </h2>
          <p className="section-body" style={{ opacity: 0 }}>
            Five layers of intelligence wrapped around every request.
            None of them require changes to your existing code.
          </p>
        </div>

        {/* Feature rows — alternating layout */}
        <div className="features-list">
          {FEATURES.map((feature, i) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              index={i}
              ref={(el) => { if (el) cardRefs.current[i] = el }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface FeatureRowProps {
  feature: typeof FEATURES[0]
  index: number
}

import { forwardRef } from 'react'

const FeatureRow = forwardRef<HTMLDivElement, FeatureRowProps>(
  ({ feature, index }, ref) => {
    const isEven = index % 2 === 0

    return (
      <motion.div
        id={feature.id}
        ref={ref}
        className={`feature-row ${isEven ? 'feature-row--ltr' : 'feature-row--rtl'}`}
        data-card
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        aria-label={feature.headline.replace('\n', ' ')}
      >
        {/* Glow overlay for hover effect */}
        <div className="card-glow" aria-hidden="true" />

        {/* Text side */}
        <div className="feature-row__text">
          <span className="overline">{feature.overline}</span>

          <h3 className="feature-headline">
            {feature.headline.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br/>}</span>
            ))}
          </h3>

          <p className="feature-body">{feature.body}</p>

          {/* Metric callout */}
          <div className="feature-metric" aria-label={`${feature.metric} — ${feature.metricLabel}`}>
            <span className="metric-value gradient-text">{feature.metric}</span>
            <span className="metric-label">{feature.metricLabel}</span>
          </div>

          <span className="feature-tag">{feature.tag}</span>
        </div>

        {/* Visual side */}
        <div className="feature-row__visual">
          {feature.videoSrc ? (
            <video
              src={feature.videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="feature-video"
              aria-hidden="true"
            />
          ) : feature.imgSrc ? (
            <img
              src={feature.imgSrc}
              alt={feature.headline.replace('\n', ' ')}
              className="feature-img"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <FeaturePlaceholder feature={feature} />
          )}
        </div>
      </motion.div>
    )
  }
)
FeatureRow.displayName = 'FeatureRow'

function FeaturePlaceholder({ feature }: { feature: typeof FEATURES[0] }) {
  return (
    <div className="feature-placeholder" aria-hidden="true">
      <div className="placeholder-metric">
        <span className="gradient-text">{feature.metric}</span>
      </div>
      <div className="placeholder-label">{feature.metricLabel}</div>
    </div>
  )
}
