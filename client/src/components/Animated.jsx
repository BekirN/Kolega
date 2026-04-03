import { useScrollAnimation } from '../hooks/useScrollAnimation'

// Osnovna fade + slide animacija
export function AnimatedSection({
  children,
  delay = 0,
  direction = 'up', // up | down | left | right | none
  distance = 32,
  duration = 0.6,
  className = '',
  style = {},
}) {
  const { ref, isVisible } = useScrollAnimation()

  const getTransform = () => {
    if (direction === 'up') return `translateY(${distance}px)`
    if (direction === 'down') return `translateY(-${distance}px)`
    if (direction === 'left') return `translateX(${distance}px)`
    if (direction === 'right') return `translateX(-${distance}px)`
    return 'none'
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : getTransform(),
        transition: `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Stagger animacija za liste
export function AnimatedList({ children, staggerDelay = 0.08, baseDelay = 0, direction = 'up' }) {
  return (
    <>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <AnimatedSection
              key={i}
              delay={baseDelay + i * staggerDelay}
              direction={direction}
            >
              {child}
            </AnimatedSection>
          ))
        : children}
    </>
  )
}

// Scale in animacija
export function AnimatedScale({ children, delay = 0, style = {}, className = '' }) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.92)',
        transition: `opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Blur reveal animacija
export function AnimatedBlur({ children, delay = 0, style = {}, className = '' }) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(8px)',
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, filter 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// Counter animacija za brojeve
export function AnimatedCounter({ value, suffix = '', prefix = '', duration = 2000, style = {} }) {
  const { ref, isVisible } = useScrollAnimation()
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    hasAnimated.current = true

    const start = Date.now()
    const end = start + duration

    const tick = () => {
      const now = Date.now()
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isVisible, value, duration])

  return (
    <span ref={ref} style={style}>
      {prefix}{count}{suffix}
    </span>
  )
}

// Linija koja se crta
export function AnimatedLine({ delay = 0, style = {} }) {
  const { ref, isVisible } = useScrollAnimation()

  return (
    <div
      ref={ref}
      style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,107,53,0.5), transparent)',
        transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
        transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
        transformOrigin: 'left',
        ...style,
      }}
    />
  )
}

import { useState } from 'react'