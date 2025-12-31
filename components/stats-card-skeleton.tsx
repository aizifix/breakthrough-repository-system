"use client"

export default function StatsCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-muted rounded w-24 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
        <div className="h-8 w-8 bg-muted rounded-lg overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
      <div className="mt-4">
        <div className="h-8 bg-muted rounded w-16 overflow-hidden relative mb-1">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
        <div className="h-3 bg-muted rounded w-40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "200ms" }}></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
      </div>
    </div>
  )
}

export function StatsCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  )
}
