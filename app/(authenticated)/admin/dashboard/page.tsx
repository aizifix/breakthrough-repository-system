"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  CheckCircle2 as ArrowUpIcon,
  ArrowRight,
  User as Users,
  FileText as BookOpen,
} from "lucide-react"
import { getDashboardStats } from "@/app/config/api"

interface DashboardStats {
  totalUsers: number
  totalRepositories: number
  pendingModeration: number
  publishedToday: number
  publishedThisWeek: number
  rejectedThisWeek: number
  totalPublished: number
  recentRepositories: Array<{
    id: number
    title: string
    publishedStatus: string
    created_at: string
    publisher_name: string
    category: string[]
  }>
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string; user_role?: string } | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
        // Redirect if not admin
        if (userData.user_role !== "admin" && userData.role !== "admin") {
          router.push("/")
        } else {
          loadDashboardStats()
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [router])

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await getDashboardStats()

      if (response.status === "success" && response.data) {
        setStats(response.data)
      } else {
        console.error("Failed to load dashboard stats:", response.message)
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    {
      label: "Moderate Content",
      path: "/admin/moderation",
      icon: AlertCircle,
      description: "Review and approve repositories",
      color: "yellow",
      count: stats?.pendingModeration || 0
    },
    {
      label: "Manage Users",
      path: "/admin/users",
      icon: Users,
      description: "View and manage user accounts",
      color: "blue"
    },
    {
      label: "View Repositories",
      path: "/admin/repositories",
      icon: BookOpen,
      description: "Browse all repositories",
      color: "purple"
    },
    {
      label: "View Reports",
      path: "/admin/reports",
      icon: FileText,
      description: "Analytics and insights",
      color: "green"
    },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>
      case "published":
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">Published</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Shield className="text-primary" size={28} />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Overview of the repository system and quick access to administrative functions
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadDashboardStats}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading dashboard statistics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Users */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="text-blue-500" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stats?.totalUsers.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registered users in the system
                  </p>
                </CardContent>
              </Card>

              {/* Total Repositories */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Repositories
                  </CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FileText className="text-purple-500" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stats?.totalRepositories.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalPublished || 0} published, {stats?.pendingModeration || 0} pending
                  </p>
                </CardContent>
              </Card>

              {/* Pending Moderation */}
              <Card className="hover:shadow-md transition-shadow border-yellow-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Moderation
                  </CardTitle>
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <RefreshCw className="text-yellow-500" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">
                    {stats?.pendingModeration || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review and approval
                  </p>
                </CardContent>
              </Card>

              {/* Published Today */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Published Today
                  </CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CheckCircle2 className="text-green-500" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {stats?.publishedToday || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    New publications today
                  </p>
                </CardContent>
              </Card>

              {/* Published This Week */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Published This Week
                  </CardTitle>
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <ArrowUpIcon className="text-emerald-500" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stats?.publishedThisWeek || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Publications in the last 7 days
                  </p>
                </CardContent>
              </Card>

              {/* Rejected This Week */}
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rejected This Week
                  </CardTitle>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <XCircle className="text-red-500" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {stats?.rejectedThisWeek || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Rejected in the last 7 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  const colorConfig = {
                    yellow: {
                      border: "border-yellow-500/20 hover:border-yellow-500/40",
                      bg: "hover:bg-yellow-500/5",
                      iconBg: "bg-yellow-500/10",
                      iconColor: "text-yellow-500"
                    },
                    blue: {
                      border: "border-blue-500/20 hover:border-blue-500/40",
                      bg: "hover:bg-blue-500/5",
                      iconBg: "bg-blue-500/10",
                      iconColor: "text-blue-500"
                    },
                    purple: {
                      border: "border-purple-500/20 hover:border-purple-500/40",
                      bg: "hover:bg-purple-500/5",
                      iconBg: "bg-purple-500/10",
                      iconColor: "text-purple-500"
                    },
                    green: {
                      border: "border-green-500/20 hover:border-green-500/40",
                      bg: "hover:bg-green-500/5",
                      iconBg: "bg-green-500/10",
                      iconColor: "text-green-500"
                    },
                  }

                  const colors = colorConfig[action.color as keyof typeof colorConfig]

                  return (
                    <Card
                      key={action.path}
                      className={`cursor-pointer transition-all hover:shadow-lg ${colors.border} ${colors.bg}`}
                      onClick={() => router.push(action.path)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 ${colors.iconBg} rounded-lg`}>
                            <Icon className={colors.iconColor} size={24} />
                          </div>
                          {action.count !== undefined && action.count > 0 && (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              {action.count}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{action.label}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-sm text-muted-foreground group-hover:text-foreground">
                          <span>Go to page</span>
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Repositories</CardTitle>
                <CardDescription>
                  Latest repository submissions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.recentRepositories && stats.recentRepositories.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentRepositories.map((repo) => (
                      <div
                        key={repo.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/moderation`)}
                      >
                        <div className={`p-2 rounded-lg ${
                          repo.publishedStatus === 'published' ? 'bg-green-500/10' :
                          repo.publishedStatus === 'pending' ? 'bg-yellow-500/10' :
                          repo.publishedStatus === 'rejected' ? 'bg-red-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          {repo.publishedStatus === 'published' ? (
                            <CheckCircle2 className={`text-green-500`} size={20} />
                          ) : repo.publishedStatus === 'pending' ? (
                            <AlertCircle className="text-yellow-500" size={20} />
                          ) : repo.publishedStatus === 'rejected' ? (
                            <XCircle className="text-red-500" size={20} />
                          ) : (
                            <FileText className="text-gray-500" size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-1">
                            <h3 className="font-medium text-foreground line-clamp-1">
                              {repo.title}
                            </h3>
                            {getStatusBadge(repo.publishedStatus)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {repo.publisher_name || "Unknown"}
                            </span>
                            <span className="flex items-center gap-1">
                              {formatDate(repo.created_at)}
                            </span>
                          </div>
                          {repo.category && repo.category.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {repo.category.slice(0, 3).map((cat, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {repo.category.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{repo.category.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-sm text-muted-foreground">No recent repositories</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
