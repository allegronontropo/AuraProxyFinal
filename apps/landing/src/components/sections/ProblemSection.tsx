import { motion } from 'framer-motion'
import { PROBLEMS } from '../../lib/content'

export function ProblemSection() {
  return (
    <section
      id="problem"
      className="section problem-section"
      aria-labelledby="problem-heading"
    >
      <div className="container">
        <div className="section-header">
          <span className="overline">{PROBLEMS.overline}</span>
          <h2 id="problem-heading" className="section-headline">
            {PROBLEMS.headline}
          </h2>
          <p className="section-body">{PROBLEMS.body}</p>
        </div>

        <div className="problem-grid">
          {PROBLEMS.items.map((item, i) => (
            <motion.div
              key={item.title}
              className="problem-card"
              data-card
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="problem-icon" aria-hidden="true">{item.icon}</div>
              <h3 className="problem-title">{item.title}</h3>
              <p className="problem-desc">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
