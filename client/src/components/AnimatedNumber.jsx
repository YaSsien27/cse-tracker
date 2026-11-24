import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion.js'

const DURATION = 700 // milliseconds

// Shows a number that counts up (or down) to its new value.
// format turns the number into text, e.g. formatMoney.
function AnimatedNumber({ value, format }) {
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0) // remembers where the count is, so a new count starts from there

  useEffect(() => {
    if (value === null) return

    const from = shownRef.current
    const duration = prefersReducedMotion() ? 0 : DURATION
    const startTime = performance.now()
    let frame

    function step(now) {
      // progress goes from 0 (start) to 1 (finished)
      const progress = duration === 0 ? 1 : Math.min(Math.max((now - startTime) / duration, 0), 1)
      const eased = 1 - (1 - progress) ** 3 // fast at first, then slows down
      const current = progress === 1 ? value : from + (value - from) * eased
      shownRef.current = current
      setShown(current)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return format(value === null ? null : shown)
}

export default AnimatedNumber
