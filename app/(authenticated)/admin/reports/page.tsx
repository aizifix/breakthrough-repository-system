"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText as BarChartIcon,
  Search,
  FileText,
  User,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  User as Users,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Repository {
  id: string
  title: string
  category: string[]
  publishedDate: string
  publishedStatus: "published" | "draft" | "unpublished" | "rejected"
  publisher: {
    name: string
    avatar: string
  }
  userId?: string
}

interface AuditLog {
  id: string
  timestamp: string
  action: string
  user: string
  userRole: string
  targetType: "repository" | "user" | "announcement" | "system"
  targetId?: string
  targetName?: string
  details?: string
  ipAddress?: string
  status: "success" | "failure" | "warning"
}

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        if (userData.role !== "admin") {
          router.push("/")
        }
      } else {
        router.push("/auth/login")
      }
      loadData()
    }
  }, [router])

  useEffect(() => {
    filterLogs()
  }, [searchQuery, actionFilter, targetTypeFilter, dateRange, auditLogs])

  const loadData = () => {
    if (typeof window !== "undefined") {
      // Load repositories
      const storedRepos = localStorage.getItem("userRepositories")
      const repos: Repository[] = storedRepos ? JSON.parse(storedRepos) : []
      setRepositories(repos)

      // Load audit logs
      const storedLogs = localStorage.getItem("auditLogs")
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs))
      } else {
        // Generate sample audit logs
        const sampleLogs: AuditLog[] = [
          {
            id: "1",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            action: "Repository Published",
            user: "Admin",
            userRole: "admin",
            targetType: "repository",
            targetId: "repo-1",
            targetName: "Advanced Neural Network Architectures",
            details: "Repository approved and published",
            status: "success",
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            action: "User Login",
            user: "Dr. Sarah Chen",
            userRole: "publisher",
            targetType: "user",
            targetId: "user-1",
            ipAddress: "192.168.1.100",
            status: "success",
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            action: "Repository Rejected",
            user: "Admin",
            userRole: "admin",
            targetType: "repository",
            targetId: "repo-2",
            targetName: "Quantum Algorithms Study",
            details: "Rejected due to insufficient citations",
            status: "warning",
          },
          {
            id: "4",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            action: "User Created",
            user: "Admin",
            userRole: "admin",
            targetType: "user",
            targetId: "user-3",
            targetName: "Dr. Maria Rodriguez",
            status: "success",
          },
          {
            id: "5",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            action: "Announcement Published",
            user: "Admin",
            userRole: "admin",
            targetType: "announcement",
            targetId: "ann-1",
            targetName: "Welcome to Breakthrough",
            status: "success",
          },
          {
            id: "6",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
            action: "Repository Unpublished",
            user: "Admin",
            userRole: "admin",
            targetType: "repository",
            targetId: "repo-3",
            targetName: "Climate Change Impact Study",
            details: "Unpublished due to content review",
            status: "warning",
          },
          {
            id: "7",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            action: "User Suspended",
            user: "Admin",
            userRole: "admin",
            targetType: "user",
            targetId: "user-2",
            targetName: "John Smith",
            details: "Account suspended for policy violation",
            status: "warning",
          },
          {
            id: "8",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            action: "Failed Login Attempt",
            user: "unknown",
            userRole: "unknown",
            targetType: "system",
            details: "Invalid credentials for admin@breakthrough.com",
            ipAddress: "192.168.1.200",
            status: "failure",
          },
        ]
        setAuditLogs(sampleLogs)
        localStorage.setItem("auditLogs", JSON.stringify(sampleLogs))
      }
    }
  }

  const filterLogs = () => {
    let filtered = [...auditLogs]

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action.toLowerCase().includes(actionFilter.toLowerCase()))
    }

    // Target type filter
    if (targetTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.targetType === targetTypeFilter)
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date()
      const filterDate = new Date()
      switch (dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      filtered = filtered.filter((log) => new Date(log.timestamp) >= filterDate)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.user.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.targetName?.toLowerCase().includes(query) ||
          log.details?.toLowerCase().includes(query)
      )
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredLogs(filtered)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 size={16} className="text-green-500" />
      case "failure":
        return <XCircle size={16} className="text-red-500" />
      case "warning":
        return <AlertCircle size={16} className="text-yellow-500" />
      default:
        return <FileText size={16} className="text-gray-500" />
    }
  }

  const getActionIcon = (action: string) => {
    if (action.includes("Repository")) return <FileText size={16} />
    if (action.includes("User")) return <User size={16} />
    if (action.includes("Announcement")) return <AlertCircle size={16} />
    if (action.includes("Login")) return <Shield size={16} />
    return <FileText size={16} />
  }

  // Repository Statistics
  const repoStats = useMemo(() => {
    const categoryCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {}
    const monthlyCounts: Record<string, number> = {}

    repositories.forEach((repo) => {
      // Category counts
      repo.category.forEach((cat) => {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      })

      // Status counts
      statusCounts[repo.publishedStatus] = (statusCounts[repo.publishedStatus] || 0) + 1

      // Monthly counts
      const date = new Date(repo.publishedDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1
    })

    return {
      total: repositories.length,
      byCategory: categoryCounts,
      byStatus: statusCounts,
      byMonth: monthlyCounts,
      topCategories: Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    }
  }, [repositories])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BarChartIcon className="text-primary" size={28} />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
                <p className="text-muted-foreground">
                  View system reports and audit logs
                </p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Download size={16} />
              Export Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="repositories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="repositories">Repository Reports</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Repository Reports Tab */}
          <TabsContent value="repositories" className="space-y-6">
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Repositories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{repoStats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Published
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {repoStats.byStatus.published || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Unpublished
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {repoStats.byStatus.unpublished || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rejected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {repoStats.byStatus.rejected || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Most popular research categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repoStats.topCategories.length > 0 ? (
                    repoStats.topCategories.map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(count / repoStats.total) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">{count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status Distribution</CardTitle>
                  <CardDescription>Repository status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(repoStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              status === "published"
                                ? "default"
                                : status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </div>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>Repositories published per month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(repoStats.byMonth)
                      .sort(([a], [b]) => b.localeCompare(a))
                      .slice(0, 6)
                      .map(([month, count]) => (
                        <div key={month} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{month}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(count / Math.max(...Object.values(repoStats.byMonth))) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="font-semibold text-sm w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search logs by user, action, or details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="repository">Repository</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="repository">Repository</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  {filteredLogs.length} of {auditLogs.length} log entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-lg font-medium text-foreground mb-2">
                      No audit logs found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || actionFilter !== "all" || targetTypeFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No audit logs available"}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {formatDate(log.timestamp)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span className="font-medium">{log.action}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.user}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.userRole}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {log.targetName ? (
                                <>
                                  <div className="font-medium">{log.targetName}</div>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {log.targetType}
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {log.details ? (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {log.details}
                                </p>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                              {log.ipAddress && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  IP: {log.ipAddress}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(log.status)}
                              <Badge
                                variant={
                                  log.status === "success"
                                    ? "default"
                                    : log.status === "failure"
                                      ? "destructive"
                                      : "secondary"
                                }
                              >
                                {log.status}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
