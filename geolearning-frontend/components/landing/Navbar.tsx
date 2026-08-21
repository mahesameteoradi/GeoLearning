'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar({ userRole }: { userRole?: string | null }) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const dashboardLink = userRole === 'ADMIN' ? '/admin' : userRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const links = [
    { name: 'Fitur', href: '#fitur' },
    { name: 'Cara Kerja', href: '#cara-kerja' },
    { name: 'Untuk Guru', href: '#untuk-guru' },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="GeoLearning Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-700 tracking-tight">GeoLearning</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors relative group">
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-blue-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
            ))}
          </div>
          <Link 
            id="tour-landing-login"
            href={userRole ? dashboardLink : '/login'}
            className="relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5"
          >
            {userRole ? 'Ke Dashboard' : 'Masuk'}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-slate-600 hover:text-blue-600 bg-white/50 backdrop-blur-sm rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu (Animated) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-5 shadow-lg">
              <div className="flex flex-col gap-4">
                {links.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href} 
                    onClick={() => {
                      // Slight delay to allow navigation to trigger before unmounting
                      setTimeout(() => setIsOpen(false), 100)
                    }}
                    className="text-lg font-semibold text-slate-600 hover:text-blue-600"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-slate-100">
                  <Link 
                    id="tour-landing-login-mobile"
                    href={userRole ? dashboardLink : '/login'}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl font-bold transition-all shadow-md"
                  >
                    {userRole ? 'Ke Dashboard' : 'Masuk'}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
