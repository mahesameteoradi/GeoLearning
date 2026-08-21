import { cn } from '@/lib/utils/cn'

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-slate-200", className)} />
  )
}

export default function TeacherDashboardLoading() {
  return (
    <div className="min-h-full p-5 lg:p-7">
      {/* Header Skeleton */}
      <div className="mb-8 rounded-2xl bg-white p-8 shadow-sm">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-5 w-96 mb-6" />
        
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
        </div>
      </div>

      {/* Classes Skeleton */}
      <div className="mb-5">
        <Skeleton className="mb-2.5 h-4 w-32" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Student Progress Table Skeleton */}
      <div className="mt-5">
        <Skeleton className="mb-2.5 h-4 w-40" />
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  )
}
