"use client"

export default function RepositoryCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      {/* Header with avatar and title skeleton */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse"></div>
        <div className="flex-1 space-y-2">
          {/* Animated title skeleton with running effect */}
          <div className="h-6 bg-muted rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
            <div className="h-full w-3/4 bg-muted-foreground/20"></div>
          </div>
          <div className="h-4 bg-muted rounded w-1/2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "200ms" }}></div>
            <div className="h-full w-full bg-muted-foreground/20"></div>
          </div>
        </div>
      </div>

      {/* Abstract skeleton with animated lines */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-muted rounded overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "100ms" }}></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
        <div className="h-4 bg-muted rounded overflow-hidden relative w-5/6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "200ms" }}></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
        <div className="h-4 bg-muted rounded overflow-hidden relative w-4/6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "300ms" }}></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
      </div>

      {/* Tags skeleton */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 bg-muted rounded-full w-20 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: `${i * 150}ms` }}></div>
            <div className="h-full w-full bg-muted-foreground/20"></div>
          </div>
        ))}
      </div>

      {/* Footer with date and buttons skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="h-4 bg-muted rounded w-24 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "400ms" }}></div>
          <div className="h-full w-full bg-muted-foreground/20"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-muted rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "500ms" }}></div>
            <div className="h-full w-full bg-muted-foreground/20"></div>
          </div>
          <div className="h-9 w-20 bg-muted rounded overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "600ms" }}></div>
            <div className="h-full w-full bg-muted-foreground/20"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
