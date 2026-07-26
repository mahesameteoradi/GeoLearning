import { DashboardClient } from './DashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GeoLearning — Student Dashboard',
  description: 'Track your XP, badges, and learning progress',
}

/**
 * Student Dashboard Page
 *
 * This is a thin Server Component wrapper — it renders instantly and
 * delegates all data fetching to DashboardClient (Client Component).
 *
 * Auth guard is already handled by StudentLayout (parent).
 * DashboardClient fetches all data client-side with parallel queries
 * and shows a skeleton while loading.
 */
export default function StudentDashboardPage() {
  return <DashboardClient />
}
