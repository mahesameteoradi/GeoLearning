import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GeoLearning — Platform Pembelajaran Geografi',
  description:
    'Platform pembelajaran geografi interaktif dengan kuis gamifikasi, XP, badge, dan diskusi real-time.',
  keywords: ['geografi', 'pembelajaran', 'pendidikan', 'kuis', 'XP', 'badge', 'siswa', 'guru'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={plusJakarta.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased" style={{ fontFamily: 'var(--font-jakarta, "Plus Jakarta Sans", system-ui, sans-serif)' }}>
        {children}

        {/* Global toast provider */}
        <Toaster
          position="bottom-right"
          gutter={10}
          containerStyle={{ bottom: 24, right: 24 }}
          toastOptions={{
            style: { background: 'transparent', boxShadow: 'none', padding: 0 },
          }}
        />
      </body>
    </html>
  )
}
