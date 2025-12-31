"use client"

export default function RepositoryTableSkeleton() {
  return (
    <TableRow>
      <TableCell className="min-w-[200px]">
        <div className="h-4 bg-muted rounded w-48 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
          <div className="h-full w-3/4 bg-muted-foreground/20"></div>
        </div>
      </TableCell>
      <TableCell className="min-w-[150px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-24 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "100ms" }}></div>
          </div>
        </div>
      </TableCell>
      <TableCell className="min-w-[180px]">
        <div className="flex flex-wrap gap-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-5 bg-muted rounded w-16 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: `${i * 100}ms` }}></div>
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="min-w-[100px]">
        <div className="h-6 bg-muted rounded w-20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "200ms" }}></div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground min-w-[150px]">
        <div className="h-4 bg-muted rounded w-32 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "300ms" }}></div>
        </div>
      </TableCell>
      <TableCell className="text-right min-w-[120px] sticky right-0 bg-card z-10 border-l border-border">
        <div className="h-8 w-8 bg-muted rounded ml-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "400ms" }}></div>
        </div>
      </TableCell>
    </TableRow>
  )
}

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function RepositoryTableSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-x-auto w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Repository</TableHead>
            <TableHead className="min-w-[150px]">Publisher</TableHead>
            <TableHead className="min-w-[180px]">Category</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[150px]">Submitted</TableHead>
            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card z-10 border-l border-border">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: count }).map((_, i) => (
            <RepositoryTableSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
