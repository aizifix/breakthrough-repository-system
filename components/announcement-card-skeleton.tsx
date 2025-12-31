"use client"

export default function AnnouncementCardSkeleton() {
  return (
    <TableRow>
      <TableCell className="min-w-[250px]">
        <div className="h-4 bg-muted rounded w-48 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
          <div className="h-full w-3/4 bg-muted-foreground/20"></div>
        </div>
      </TableCell>
      <TableCell className="min-w-[100px]">
        <div className="h-6 bg-muted rounded w-16 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "200ms" }}></div>
        </div>
      </TableCell>
      <TableCell className="min-w-[120px]">
        <div className="h-4 bg-muted rounded w-28 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "300ms" }}></div>
        </div>
      </TableCell>
      <TableCell className="min-w-[120px]">
        <div className="h-4 bg-muted rounded w-28 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "400ms" }}></div>
        </div>
      </TableCell>
      <TableCell className="text-right sticky right-0 bg-card z-10 border-l border-border">
        <div className="h-8 w-8 bg-muted rounded ml-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "500ms" }}></div>
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

export function AnnouncementTableSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[250px]">Title</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Created</TableHead>
            <TableHead className="min-w-[120px]">Updated</TableHead>
            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card z-10 border-l border-border">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: count }).map((_, i) => (
            <AnnouncementCardSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
