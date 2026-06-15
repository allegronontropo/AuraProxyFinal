import { useEffect } from 'react'
import { NavBar }            from './components/ui/NavBar'
import { HeroSection }       from './components/sections/HeroSection'
import { ProblemSection }    from './components/sections/ProblemSection'
import { StatsStrip }        from './components/sections/StatsStrip'
import { FeaturesSection }   from './components/sections/FeaturesSection'
import { HowItWorksSection } from './components/sections/HowItWorksSection'
import { ComparisonSection } from './components/sections/ComparisonSection'
import { DeploySection }     from './components/sections/DeploySection'
import { Footer }            from './components/ui/Footer'
import { cleanupAnimations } from './lib/animations'

export default function App() {
  useEffect(() => {
    return () => cleanupAnimations()
  }, [])

  return (
    <>
      <a href="#hero" className="skip-link">Skip to main content</a>
      <NavBar />
      <main id="main-content">
        <HeroSection />
        <div className="section-divider" aria-hidden="true" />
        <ProblemSection />
        <div className="section-divider" aria-hidden="true" />
        <StatsStrip />
        <div className="section-divider" aria-hidden="true" />
        <FeaturesSection />
        <div className="section-divider" aria-hidden="true" />
        <HowItWorksSection />
        <div className="section-divider" aria-hidden="true" />
        <ComparisonSection />
        <div className="section-divider" aria-hidden="true" />
        <DeploySection />
      </main>
      <Footer />
    </>
  )
}
