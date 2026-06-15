import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { STATS } from '../../lib/content'
import { animateCounters } from '../../lib/animations'

export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    animateCounters()
  }, [])

  return (
    <div className="stats-strip" ref={ref} role="list" aria-label="Key metrics">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="stat-item"
          role="listitem"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="stat-value" aria-label={`${stat.prefix}${stat.value}${stat.suffix}`}>
            <span className="stat-prefix">{stat.prefix}</span>
            <span
              className="stat-number"
              data-counter={stat.value}
              data-suffix={stat.suffix}
              data-prefix={stat.prefix}
              data-decimals={stat.decimals}
            >
              {stat.value}{stat.suffix}
            </span>
          </div>
          <div className="stat-label">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  )
}
