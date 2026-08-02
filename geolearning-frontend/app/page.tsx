import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import FiturSection from '@/components/landing/FiturSection'
import CaraKerjaSection from '@/components/landing/CaraKerjaSection'
import UntukGuruSection from '@/components/landing/UntukGuruSection'
import StatistikSection from '@/components/landing/StatistikSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import WelcomeScreen from '@/components/landing/WelcomeScreen'

export const metadata = {
  title: 'GeoLearning — Platform Kuis Interaktif & Gamifikasi',
  description: 'Platform pembelajaran geografi interaktif dengan kuis gamifikasi, sistem level, dan soal peta/lokasi.',
}

export default async function LandingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role || user.user_metadata?.role || 'STUDENT'
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
      <WelcomeScreen />
      <Navbar userRole={role} />
      <main className="flex-1">
        <Hero />
        <FiturSection />
        <CaraKerjaSection />
        <UntukGuruSection />
        <StatistikSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
