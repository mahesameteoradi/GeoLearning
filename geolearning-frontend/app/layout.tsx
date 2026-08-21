import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GeoLearning — Platform Pembelajaran Geografi',
  description:
    'Platform pembelajaran geografi interaktif dengan kuis gamifikasi, XP, badge, dan diskusi real-time.',
  keywords: ['geografi', 'pembelajaran', 'pendidikan', 'kuis', 'XP', 'badge', 'siswa', 'guru'],
}

import { ConfirmProvider } from '@/components/ui/ConfirmProvider'
import { TourProvider } from '@/components/providers/TourProvider'
import NextTopLoader from 'nextjs-toploader'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={outfit.variable} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased" style={{ fontFamily: 'var(--font-outfit, system-ui, sans-serif)' }}>
        <TourProvider>
          <ConfirmProvider>
            <NextTopLoader
              color="#4F46E5"
              initialPosition={0.08}
              crawlSpeed={200}
              height={3}
              crawl={true}
              showSpinner={false}
              easing="ease"
              speed={200}
              shadow="0 0 10px #4F46E5,0 0 5px #4F46E5"
            />
            {children}
          </ConfirmProvider>
        </TourProvider>

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
