import { useEffect } from 'react'

/**
 * Marks `.public-reveal` nodes visible when they enter the viewport.
 * Respects prefers-reduced-motion (reveals immediately).
 */
export function PublicRevealObserver() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>('.public-reveal'),
    )

    if (nodes.length === 0) return

    if (reduceMotion) {
      for (const node of nodes) {
        node.classList.add('public-reveal-visible')
      }
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('public-reveal-visible')
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    for (const node of nodes) {
      observer.observe(node)
    }

    return () => observer.disconnect()
  }, [])

  return null
}
