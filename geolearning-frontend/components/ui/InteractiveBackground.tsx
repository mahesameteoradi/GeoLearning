'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export function InteractiveBackground() {
  const mouseX = useMotionValue(-1000)
  const mouseY = useMotionValue(-1000)
  
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 })
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 })
  
  // Offset by half the width/height (600/2 = 300) so the cursor is at the center
  const translateX = useTransform(smoothX, (x) => x - 300)
  const translateY = useTransform(smoothY, (y) => y - 300)
  
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame to throttle the updates slightly if needed,
      // but framer-motion's motion values are already optimized.
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  if (!mounted) return null

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-0 h-[600px] w-[600px] rounded-full"
      style={{ 
        x: translateX, 
        y: translateY,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent 60%)',
        willChange: 'transform'
      }}
    />
  )
}
