"use client"

export default function UserTableSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-32 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
            </div>
            <div className="h-3 bg-muted rounded w-48 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "100ms" }}></div>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-6 bg-muted rounded w-16 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "200ms" }}></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-40 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "300ms" }}></div>
          </div>
          <div className="h-3 bg-muted rounded w-24 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "400ms" }}></div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-6 bg-muted rounded w-20 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "500ms" }}></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-muted rounded w-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "600ms" }}></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-4 bg-muted rounded w-28 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "700ms" }}></div>
        </div>
      </TableCell>
      <TableCell className="text-right sticky right-0 bg-card z-10 border-l border-border">
        <div className="h-8 w-8 bg-muted rounded ml-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]" style={{ animationDelay: "800ms" }}></div>
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

export function UserTableSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">User</TableHead>
            <TableHead className="min-w-[100px]">Role</TableHead>
            <TableHead className="min-w-[150px]">Institution</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="min-w-[100px]">Repositories</TableHead>
            <TableHead className="min-w-[120px]">Joined</TableHead>
            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card z-10 border-l border-border">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: count }).map((_, i) => (
            <UserTableSkeleton key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
