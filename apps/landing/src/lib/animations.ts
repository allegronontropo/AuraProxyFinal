// ============================================================
// AURA PROXY — GSAP Animation System
// All timelines, ScrollTriggers, and hover interactions
// Implements aura-motion skill exactly
// ============================================================

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, CustomEase)

// ─── Custom Eases ────────────────────────────────────────────
CustomEase.create('aura.enter',   '0.16, 1, 0.3, 1')
CustomEase.create('aura.hover',   '0.25, 0, 0.25, 1')
CustomEase.create('aura.exit',    '0.4, 0, 1, 1')
CustomEase.create('aura.stagger', '0.16, 1, 0.3, 1')

// ─── Timing Constants ────────────────────────────────────────
export const DURATION = {
  instant:  0.08,
  micro:    0.15,
  fast:     0.25,
  standard: 0.45,
  slow:     0.75,
  epic:     1.1,
}

export const STAGGER = {
  tight:   0.04,
  default: 0.08,
  loose:   0.14,
}

// ─── Reduced Motion Guard ────────────────────────────────────
export const prefersReduced = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches

// ─── Hero Entrance ───────────────────────────────────────────
export function animateHero(): gsap.core.Timeline {
  const tl = gsap.timeline({ delay: 0.1 })

  if (prefersReduced) {
    gsap.set('[data-hero]', { opacity: 1, y: 0, scale: 1, filter: 'none' })
    return tl
  }

  // Badge
  tl.fromTo('[data-hero="badge"]',
    { opacity: 0, y: 12, filter: 'blur(4px)' },
    { opacity: 1, y: 0, filter: 'blur(0px)',
      duration: DURATION.fast, ease: 'aura.enter' }
  )

  // Headline
  tl.fromTo('[data-hero="headline"]',
    { opacity: 0, y: 20, rotationX: -8 },
    {
      opacity: 1, y: 0, rotationX: 0,
      duration: DURATION.slow,
      ease: 'aura.enter',
    }, '-=0.1'
  )

  // Subheadline
  tl.fromTo('[data-hero="sub"]',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: DURATION.standard, ease: 'aura.enter' },
    '-=0.3'
  )

  // CTA buttons
  tl.fromTo('[data-hero="cta"]',
    { opacity: 0, y: 8, scale: 0.97 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: DURATION.standard,
      ease: 'aura.enter',
      stagger: 0.06,
    }, '-=0.2'
  )

  // Hero visual (video/diagram)
  tl.fromTo('[data-hero="visual"]',
    { opacity: 0, y: 32, scale: 0.97, filter: 'blur(8px)' },
    {
      opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
      duration: DURATION.epic,
      ease: 'aura.enter',
    }, '-=0.4'
  )

  return tl
}

// ─── Standard Scroll Reveal ───────────────────────────────────
export function revealOnScroll(
  selector: string,
  options: {
    y?: number
    blur?: boolean
    duration?: number
    ease?: string
    start?: string
    stagger?: number
  } = {}
) {
  if (prefersReduced) {
    gsap.set(selector, { opacity: 1, y: 0, filter: 'none' })
    return
  }

  const elements = gsap.utils.toArray<Element>(selector)

  if (options.stagger && elements.length > 1) {
    gsap.fromTo(elements,
      {
        opacity: 0,
        y: options.y ?? 24,
        filter: options.blur ? 'blur(6px)' : 'none',
      },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: options.duration ?? DURATION.standard,
        ease: options.ease ?? 'aura.stagger',
        stagger: options.stagger,
        scrollTrigger: {
          trigger: elements[0] as Element,
          start: options.start ?? 'top 88%',
          once: true,
        }
      }
    )
    return
  }

  elements.forEach((el) => {
    gsap.fromTo(el,
      {
        opacity: 0,
        y: options.y ?? 24,
        filter: options.blur ? 'blur(6px)' : 'none',
      },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: options.duration ?? DURATION.standard,
        ease: options.ease ?? 'aura.enter',
        scrollTrigger: {
          trigger: el,
          start: options.start ?? 'top 88%',
          once: true,
        }
      }
    )
  })
}

// ─── Section Header Reveal ────────────────────────────────────
export function revealSectionHeader(sectionEl: Element) {
  if (prefersReduced) return

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: sectionEl,
      start: 'top 82%',
      once: true,
    }
  })

  const overline  = sectionEl.querySelector('.section-overline')
  const headline  = sectionEl.querySelector('.section-headline')
  const body      = sectionEl.querySelector('.section-body')

  if (overline) {
    tl.fromTo(overline,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: DURATION.fast, ease: 'aura.enter' }
    )
  }
  if (headline) {
    tl.fromTo(headline,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: DURATION.standard, ease: 'aura.enter' },
      '-=0.1'
    )
  }
  if (body) {
    tl.fromTo(body,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: DURATION.standard, ease: 'aura.enter' },
      '-=0.15'
    )
  }
}

// ─── Card Grid Reveal ─────────────────────────────────────────
export function revealCardGrid(gridSelector: string) {
  if (prefersReduced) {
    gsap.set(`${gridSelector} [data-card]`, { opacity: 1, y: 0, scale: 1 })
    return
  }

  const cards = gsap.utils.toArray<Element>(`${gridSelector} [data-card]`)
  if (!cards.length) return

  gsap.fromTo(cards,
    { opacity: 0, y: 28, scale: 0.97 },
    {
      opacity: 1, y: 0, scale: 1,
      duration: DURATION.standard,
      ease: 'aura.stagger',
      stagger: STAGGER.default,
      scrollTrigger: {
        trigger: gridSelector,
        start: 'top 85%',
        once: true,
      }
    }
  )
}

// ─── SVG Path Draw Animation ──────────────────────────────────
export function animateSVGPaths(containerSelector: string) {
  if (prefersReduced) return

  const paths = gsap.utils.toArray<SVGPathElement>(
    `${containerSelector} path[data-draw], ${containerSelector} line[data-draw]`
  )

  paths.forEach((path) => {
    const length = path.getTotalLength?.() ?? 200
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })
  })

  gsap.to(paths, {
    strokeDashoffset: 0,
    duration: 0.8,
    ease: 'none',
    stagger: 0.1,
    scrollTrigger: {
      trigger: containerSelector,
      start: 'top 75%',
      once: true,
    }
  })
}

// ─── Stat Counter ─────────────────────────────────────────────
export function animateCounters() {
  if (prefersReduced) return

  const counters = gsap.utils.toArray<HTMLElement>('[data-counter]')
  counters.forEach((el) => {
    const target = parseFloat(el.dataset.counter ?? '0')
    const suffix = el.dataset.suffix ?? ''
    const prefix = el.dataset.prefix ?? ''
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0

    gsap.fromTo({ val: 0 },
      { val: 0 },
      {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        snap: decimals === 0 ? { val: 1 } : {},
        onUpdate: function () {
          el.textContent = prefix + (this.targets()[0] as { val: number }).val.toFixed(decimals) + suffix
        },
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        }
      }
    )
  })
}

// ─── Magnetic Button ─────────────────────────────────────────
export function addMagneticEffect(btnEl: HTMLElement) {
  if (prefersReduced) return

  btnEl.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = btnEl.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) * 0.18
    const y = (e.clientY - rect.top - rect.height / 2) * 0.18
    gsap.to(btnEl, { x, y, duration: DURATION.fast, ease: 'aura.hover' })
  })
  btnEl.addEventListener('mouseleave', () => {
    gsap.to(btnEl, { x: 0, y: 0, duration: DURATION.standard, ease: 'aura.enter' })
  })
}

// ─── Card Hover Glow ─────────────────────────────────────────
export function addCardHoverGlow(cardEl: HTMLElement) {
  if (prefersReduced) return

  const glow = cardEl.querySelector<HTMLElement>('.card-glow')

  cardEl.addEventListener('mouseenter', () => {
    if (glow) gsap.to(glow, { opacity: 1, duration: DURATION.micro, ease: 'aura.hover' })
    gsap.to(cardEl, { y: -3, duration: DURATION.fast, ease: 'aura.hover' })
  })
  cardEl.addEventListener('mouseleave', () => {
    if (glow) gsap.to(glow, { opacity: 0, duration: DURATION.micro, ease: 'aura.exit' })
    gsap.to(cardEl, { y: 0, duration: DURATION.fast, ease: 'aura.exit' })
  })
}

// ─── Typewriter Effect ────────────────────────────────────────
export function typewriterEffect(
  el: HTMLElement,
  lines: string[],
  options: { speed?: number; cursorChar?: string } = {}
) {
  const speed = options.speed ?? 35
  const cursor = options.cursorChar ?? '▋'

  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top 70%',
    once: true,
    onEnter: () => {
      let lineIndex = 0
      let charIndex = 0
      el.textContent = ''

      const cursorEl = document.createElement('span')
      cursorEl.className = 'typewriter-cursor'
      cursorEl.textContent = cursor
      el.appendChild(cursorEl)

      const tick = () => {
        if (lineIndex >= lines.length) {
          gsap.to(cursorEl, { opacity: 0, duration: 0.4, repeat: -1, yoyo: true })
          return
        }

        const line = lines[lineIndex]
        if (charIndex < line.length) {
          el.insertBefore(
            document.createTextNode(line[charIndex]),
            cursorEl
          )
          charIndex++
          setTimeout(tick, speed)
        } else {
          el.insertBefore(document.createTextNode('\n'), cursorEl)
          lineIndex++
          charIndex = 0
          setTimeout(tick, speed * 4)
        }
      }

      tick()
    }
  })

  return st
}

// ─── Navbar Scroll Effect ─────────────────────────────────────
export function initNavScroll(navEl: HTMLElement) {
  ScrollTrigger.create({
    start: 'top -50px',
    onUpdate: (self) => {
      navEl.dataset.scrolled = String(self.progress > 0)
    }
  })
}

// ─── Cleanup ─────────────────────────────────────────────────
export function cleanupAnimations() {
  ScrollTrigger.getAll().forEach((t) => t.kill())
}
