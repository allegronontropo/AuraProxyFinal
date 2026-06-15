import { motion } from 'framer-motion'
import { COMPARISON } from '../../lib/content'

export function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="section comparison-section"
      aria-labelledby="comparison-heading"
    >
      <div className="container">
        <div className="section-header">
          <span className="overline">{COMPARISON.overline}</span>
          <h2 id="comparison-heading" className="section-headline">
            {COMPARISON.headline.split('\n').map((l, i) => (
              <span key={i}>{l}{i === 0 && <br/>}</span>
            ))}
          </h2>
        </div>

        <motion.div
          className="comparison-table-wrap"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <table className="comparison-table" role="grid" aria-label="Feature comparison">
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th scope="col" className="col-aura">
                  <span className="aura-badge">◈ Aura Proxy</span>
                </th>
                {COMPARISON.competitors.map((c) => (
                  <th key={c} scope="col">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.rows.map((row, i) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  <td>{row.feature}</td>
                  <td className="col-aura">
                    <CheckBadge value={row.aura} highlight />
                  </td>
                  <td><CheckBadge value={row.portkey} /></td>
                  <td><CheckBadge value={row.helicone} /></td>
                  <td><CheckBadge value={row.litellm} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}

function CheckBadge({ value, highlight = false }: { value: boolean; highlight?: boolean }) {
  return (
    <span
      className={`check-badge ${value ? 'check-badge--yes' : 'check-badge--no'} ${highlight ? 'check-badge--highlight' : ''}`}
      aria-label={value ? 'Supported' : 'Not supported'}
    >
      {value ? '✓' : '✗'}
    </span>
  )
}
