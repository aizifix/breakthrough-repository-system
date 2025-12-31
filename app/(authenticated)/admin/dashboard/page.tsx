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
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  ArrowRight,
  Users,
  BookOpen,
  BarChart,
  Megaphone,
  Crown,
  TrendingUp,
  Clock,
} from "lucide-react"
import { getDashboardStats } from "@/app/config/api"
import { StatsCardSkeletonGrid } from "@/components/stats-card-skeleton"
import RepositoryCardSkeleton from "@/components/repository-card-skeleton"
import { cn } from "@/lib/utils"

interface RecentRepo {
  id: number
  title: string
  publishedStatus: string
  created_at: string
  publisher_name: string
  category: string[]
}

interface DashboardStats {
  totalUsers: number
  totalRepositories: number
  pendingModeration: number
  publishedToday: number
  publishedThisWeek: number
  rejectedThisWeek: number
  totalPublished: number
  recentRepositories: RecentRepo[]
}

const statCards = [
  { key: "totalUsers", label: "Total Users", icon: Users, color: "blue" as const, desc: "Registered users" },
  { key: "totalRepositories", label: "Total Repositories", icon: BookOpen, color: "purple" as const, desc: "All submissions" },
  { key: "pendingModeration", label: "Pending Review", icon: AlertCircle, color: "yellow" as const, desc: "Awaiting approval" },
  { key: "publishedToday", label: "Published Today", icon: CheckCircle2, color: "green" as const, desc: "New today" },
  { key: "publishedThisWeek", label: "This Week", icon: TrendingUp, color: "emerald" as const, desc: "Last 7 days" },
  { key: "rejectedThisWeek", label: "Rejected", icon: XCircle, color: "red" as const, desc: "This week" },
]

type ColorType = "yellow" | "blue" | "purple" | "green" | "emerald" | "red"

const colorMap: Record<ColorType, { bg: string; text: string; border: string }> = {
  yellow: { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
  green: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string; user_role?: string; avatar?: string } | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user")
      if (stored) {
        const userData = JSON.parse(stored)
        setUser(userData)
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
        console.error("Failed to load dashboard stats:", response.message || "Unknown error")
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const quickActions = [
    { label: "Moderation", path: "/admin/moderation", icon: AlertCircle, description: "Review submissions", color: "yellow" as ColorType, count: stats?.pendingModeration || 0 },
    { label: "Users", path: "/admin/users", icon: Users, description: "Manage users", color: "blue" as ColorType },
    { label: "Announcements", path: "/admin/announcements", icon: Megaphone, description: "Post updates", color: "purple" as ColorType },
    { label: "Reports", path: "/admin/reports", icon: BarChart, description: "View analytics", color: "green" as ColorType },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>
      case "published": return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Published</Badge>
      case "rejected": return <Badge variant="destructive">Rejected</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getAvatarInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  if (!user) return null

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="text-primary-foreground" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadDashboardStats} disabled={isLoading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          <StatsCardSkeletonGrid count={6} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border rounded-xl p-6 bg-card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => <RepositoryCardSkeleton key={i} />)}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon
              const colors = colorMap[stat.color]
              const value = stat.key === "totalUsers" ? stats?.totalUsers :
                           stat.key === "totalRepositories" ? stats?.totalRepositories :
                           stat.key === "pendingModeration" ? stats?.pendingModeration :
                           stat.key === "publishedToday" ? stats?.publishedToday :
                           stat.key === "publishedThisWeek" ? stats?.publishedThisWeek :
                           stats?.rejectedThisWeek

              return (
                <Card key={stat.key} className="hover:shadow-lg transition-all duration-300 border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                    <div className={cn("p-2.5 rounded-xl", colors.bg)}>
                      <Icon className={colors.text} size={20} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground mb-1">{value?.toLocaleString() || 0}</div>
                    <p className="text-xs text-muted-foreground">{stat.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Crown className="text-amber-500" size={20} />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon
                const colors = colorMap[action.color]

                return (
                  <Card key={action.path} className={cn(
                    "cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                    colors.border, colors.bg
                  )} onClick={() => router.push(action.path)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={cn("p-2.5 rounded-xl", colors.bg)}>
                          <Icon className={colors.text} size={22} />
                        </div>
                        {(action as any).count > 0 && (
                          <Badge className={cn("bg-primary/10 text-primary border-primary/20")}>
                            {action.count}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base mt-3">{action.label}</CardTitle>
                      <CardDescription className="text-xs">{action.description}</CardDescription>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock size={20} className="text-muted-foreground" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest repository submissions and updates</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/admin/moderation")}>
                  View All <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {stats?.recentRepositories && stats.recentRepositories.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recentRepositories.map((repo) => (
                    <div key={repo.id} className="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/moderation`)}>
                      <div className={cn("p-2.5 rounded-xl flex-shrink-0", 
                        repo.publishedStatus === 'published' ? "bg-green-500/10" :
                        repo.publishedStatus === 'pending' ? "bg-yellow-500/10" :
                        repo.publishedStatus === 'rejected' ? "bg-red-500/10" : "bg-gray-500/10"
                      )}>
                        {repo.publishedStatus === 'published' ? <CheckCircle2 className="text-green-500" size={18} /> :
                         repo.publishedStatus === 'pending' ? <AlertCircle className="text-yellow-500" size={18} /> :
                         repo.publishedStatus === 'rejected' ? <XCircle className="text-red-500" size={18} /> :
                         <FileText className="text-gray-500" size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-medium text-foreground line-clamp-1">{repo.title}</h3>
                          {getStatusBadge(repo.publishedStatus)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-medium">
                              {getAvatarInitials(repo.publisher_name || "U")}
                            </div>
                            {repo.publisher_name || "Unknown"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatDate(repo.created_at)}
                          </span>
                        </div>
                        {repo.category && repo.category.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {repo.category.slice(0, 3).map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{cat}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-muted-foreground" size={32} />
                  </div>
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
