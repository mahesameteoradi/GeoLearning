import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoLearning — Masuk',
  description: 'Masuk ke akun GeoLearning Anda',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50">
      
      {/* Premium Mesh Gradient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-blue-200/40 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-blue-200/30 blur-[130px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-blue-200/20 blur-[90px]" />
      </div>

      {/* Subtle Dot Grid */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.4]"
        style={{
          backgroundImage: `radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
        }} 
      />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl px-4 py-8">
        {children}
      </div>
    </div>
  )
}
