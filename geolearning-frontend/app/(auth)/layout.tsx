import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoLearning — Masuk',
  description: 'Masuk ke akun GeoLearning Anda',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8FAFC]">

      {/* Subtle light background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blue glow top-left */}
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        {/* Teal glow bottom-right */}
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)' }} />
        {/* Amber glow top-right */}
        <div className="absolute top-10 right-10 h-64 w-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)' }} />

        {/* Subtle grid dots */}
        <div className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `radial-gradient(circle, #CBD5E1 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }} />
      </div>

      {/* Decorative floating academic icons */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        <span className="absolute top-[10%] left-[7%] text-5xl opacity-[0.08]">📚</span>
        <span className="absolute top-[15%] right-[9%] text-4xl opacity-[0.07]">🎓</span>
        <span className="absolute bottom-[18%] left-[5%] text-4xl opacity-[0.07]">✏️</span>
        <span className="absolute bottom-[10%] right-[7%] text-5xl opacity-[0.07]">🗺️</span>
        <span className="absolute top-[42%] left-[3%] text-3xl opacity-[0.06]">🔬</span>
        <span className="absolute top-[58%] right-[4%] text-3xl opacity-[0.06]">🌍</span>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">{children}</div>
    </div>
  )
}
