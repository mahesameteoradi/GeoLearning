'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion'

export function InteractiveBackground() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 })
  const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 })
  const cursorBackground = useMotionTemplate`radial-gradient(600px circle at ${smoothX}px ${smoothY}px, rgba(99, 102, 241, 0.08), transparent 40%)`

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: cursorBackground }}
    />
  )
}
