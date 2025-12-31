"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
  Shield,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  User,
  FileText,
  AlertCircle,
  MoreVertical,
  ArrowLeft,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getRepositoriesForModeration, approveRepository, rejectRepository } from "@/app/config/api"
import { RepositoryTableSkeletonList } from "@/components/repository-table-skeleton"

interface Repository {
  id: number | string
  title: string
  abstract: string
  publisher: number | {
    name: string
    avatar: string
  }
  publisher_name?: string
  publisher_email?: string
  publisher_school?: string
  publisher_department?: string
  category: string[] | string
  tags: string[] | string
  publishedDate: string | null
  publishedStatus: "published" | "draft" | "unpublished" | "pending" | "rejected"
  pdfUrl?: string | null
  pdfData?: string
  userId?: string
  submittedAt?: string
  created_at?: string
  moderationNotes?: string
  moderatedBy?: string
  moderatedAt?: string
}

export default function ModerationPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filteredRepositories, setFilteredRepositories] = useState<Repository[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false)
  const [moderationAction, setModerationAction] = useState<"approve" | "reject" | null>(null)
  const [moderationNote, setModerationNote] = useState("")
  const [publicationYear, setPublicationYear] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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
          loadRepositories()
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [router])

  useEffect(() => {
    filterRepositories()
  }, [searchQuery, statusFilter, repositories])

  const loadRepositories = async () => {
    try {
      setIsLoading(true)
      const response = await getRepositoriesForModeration()

      if (response.status === "success" && response.data) {
        // Format repositories to match expected structure
        const formattedRepos: Repository[] = response.data.map((repo: any) => ({
          ...repo,
          id: repo.id.toString(),
          publisher: {
            name: repo.publisher_name || "Unknown",
            avatar: (repo.publisher_name || "U")
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          },
          category: Array.isArray(repo.category) ? repo.category : (repo.category ? (typeof repo.category === 'string' ? repo.category.split(', ') : [repo.category]) : []),
          tags: Array.isArray(repo.tags) ? repo.tags : (repo.tags ? (typeof repo.tags === 'string' ? repo.tags.split(', ') : [repo.tags]) : []),
          submittedAt: repo.created_at || repo.publishedDate,
        }))

        setRepositories(formattedRepos)
      } else {
        console.error("Failed to load repositories:", response.message || "Unknown error")
        setRepositories([])
      }
    } catch (error) {
      console.error("Error fetching repositories:", error)
      setRepositories([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterRepositories = () => {
    let filtered = [...repositories]

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.publishedStatus === statusFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((r) => {
        const publisherName = typeof r.publisher === 'object' ? r.publisher.name : (r.publisher_name || '')
        const categories = Array.isArray(r.category) ? r.category : []
        const tags = Array.isArray(r.tags) ? r.tags : []

        return (
          r.title.toLowerCase().includes(query) ||
          r.abstract.toLowerCase().includes(query) ||
          publisherName.toLowerCase().includes(query) ||
          categories.some((c) => c.toLowerCase().includes(query)) ||
          tags.some((t) => t.toLowerCase().includes(query))
        )
      })
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => {
      const dateA = a.submittedAt || a.created_at || a.publishedDate
      const dateB = b.submittedAt || b.created_at || b.publishedDate
      return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime()
    })

    setFilteredRepositories(filtered)
  }

  const handleViewRepository = (repo: Repository) => {
    setSelectedRepository(repo)
    setIsViewDialogOpen(true)
  }

  const handleModerate = (repo: Repository, action: "approve" | "reject") => {
    setSelectedRepository(repo)
    setModerationAction(action)
    setModerationNote("")
    // Set default publication year to current year
    setPublicationYear(new Date().getFullYear().toString())
    setIsModerationDialogOpen(true)
  }

  const handleModerationSubmit = async () => {
    if (!selectedRepository) return

    setIsSubmitting(true)

    try {
      const repositoryId = typeof selectedRepository.id === 'string'
        ? parseInt(selectedRepository.id)
        : selectedRepository.id

      let response
      if (moderationAction === "approve") {
        // Format publication date: use January 1st of the selected year
        const publishedDate = publicationYear ? `${publicationYear}-01-01` : undefined
        response = await approveRepository(repositoryId, publishedDate)
      } else {
        response = await rejectRepository(repositoryId, moderationNote || undefined)
      }

      if (response.status === "success") {
        // Reload repositories to get updated data
        await loadRepositories()

        setIsModerationDialogOpen(false)
        setSelectedRepository(null)
        setModerationNote("")
        setPublicationYear("")
        setModerationAction(null)
      } else {
        alert(response?.message || "Failed to moderate repository. Please try again.")
      }
    } catch (error) {
      console.error("Error moderating repository:", error)
      alert("Failed to moderate repository. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle size={12} />
            Pending
          </Badge>
        )
      case "published":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 size={12} />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle size={12} />
            Rejected
          </Badge>
        )
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const stats = {
    pending: repositories.filter((r) => r.publishedStatus === "pending").length,
    approved: repositories.filter((r) => r.publishedStatus === "published").length,
    rejected: repositories.filter((r) => r.publishedStatus === "rejected").length,
    total: repositories.length,
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin">Admin</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Content Moderation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-primary" size={24} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Content Moderation</h1>
              <p className="text-muted-foreground">
                Review and moderate submitted research repositories
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reviewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search repositories by title, author, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="published">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Repositories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Repositories</CardTitle>
            <CardDescription>
              {filteredRepositories.length} of {repositories.length} repositories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <RepositoryTableSkeletonList count={8} />
            ) : filteredRepositories.length === 0 ? (
              <div className="text-center py-12 px-6">
                <Shield className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-lg font-medium text-foreground mb-2">
                  No repositories found
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "No repositories to moderate"}
                </p>
              </div>
            ) : (
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
                    {filteredRepositories.map((repo) => {
                      const publisherName = typeof repo.publisher === 'object' ? repo.publisher.name : (repo.publisher_name || 'Unknown')
                      const publisherAvatar = typeof repo.publisher === 'object' ? repo.publisher.avatar : (
                        (repo.publisher_name || "U")
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      )
                      const categories = Array.isArray(repo.category) ? repo.category : []

                      return (
                        <TableRow key={repo.id}>
                          <TableCell className="min-w-[200px]">
                            <div className="font-medium truncate max-w-[300px]" title={repo.title}>
                              {repo.title}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-semibold shrink-0">
                                {publisherAvatar}
                              </div>
                              <span className="text-sm whitespace-nowrap">{publisherName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <div className="flex flex-wrap gap-1">
                              {categories.slice(0, 2).map((cat) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                              {categories.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[100px]">
                            {getStatusBadge(repo.publishedStatus)}
                          </TableCell>
                          <TableCell className="text-muted-foreground min-w-[150px]">
                            <div className="flex items-center gap-1 text-sm whitespace-nowrap">
                              {formatDate(repo.submittedAt || repo.created_at || repo.publishedDate)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right min-w-[120px] sticky right-0 bg-card z-10 border-l border-border">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewRepository(repo)}>
                                  <Eye size={16} className="mr-2" />
                                  View Repository
                                </DropdownMenuItem>
                                {repo.publishedStatus === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleModerate(repo, "approve")}
                                      className="text-green-600"
                                    >
                                      <CheckCircle2 size={16} className="mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleModerate(repo, "reject")}
                                      className="text-red-600"
                                    >
                                      <XCircle size={16} className="mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Repository Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Repository Details</DialogTitle>
              <DialogDescription>
                Review the repository information before making a decision
              </DialogDescription>
            </DialogHeader>
            {selectedRepository && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                  <p className="text-lg font-semibold mt-1">{selectedRepository.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Abstract</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedRepository.abstract}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Publisher</Label>
                    <p className="text-sm mt-1">
                      {typeof selectedRepository.publisher === 'object'
                        ? selectedRepository.publisher.name
                        : (selectedRepository.publisher_name || 'Unknown')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRepository.publishedStatus)}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(selectedRepository.category) ? selectedRepository.category : []).map((cat) => (
                      <Badge key={cat} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(selectedRepository.tags) ? selectedRepository.tags : []).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedRepository.moderationNotes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Moderation Notes
                    </Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-lg">
                      {selectedRepository.moderationNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {selectedRepository?.publishedStatus === "pending" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      if (selectedRepository) {
                        handleModerate(selectedRepository, "reject")
                      }
                    }}
                    className="text-red-600"
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewDialogOpen(false)
                      if (selectedRepository) {
                        handleModerate(selectedRepository, "approve")
                      }
                    }}
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Approve
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Moderation Dialog */}
        <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {moderationAction === "approve" ? "Approve Repository" : "Reject Repository"}
              </DialogTitle>
              <DialogDescription>
                {moderationAction === "approve"
                  ? "This repository will be published and made available to all users."
                  : "This repository will be rejected. You can provide a reason for the rejection."}
              </DialogDescription>
            </DialogHeader>
            {selectedRepository && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium">Repository</Label>
                  <p className="text-sm mt-1 font-medium">{selectedRepository.title}</p>
                </div>
                {moderationAction === "approve" && (
                  <div className="space-y-2">
                    <Label htmlFor="publicationYear">Publication Year *</Label>
                    <Select
                      value={publicationYear}
                      onValueChange={setPublicationYear}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Select publication year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {Array.from({ length: 50 }, (_, i) => {
                          const year = new Date().getFullYear() - i
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select the year when this research was published or should be published
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="moderationNote">
                    {moderationAction === "approve" ? "Notes (Optional)" : "Rejection Reason *"}
                  </Label>
                  <Textarea
                    id="moderationNote"
                    value={moderationNote}
                    onChange={(e) => setModerationNote(e.target.value)}
                    placeholder={
                      moderationAction === "approve"
                        ? "Add any notes about this approval..."
                        : "Please provide a reason for rejection..."
                    }
                    rows={4}
                    required={moderationAction === "reject"}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsModerationDialogOpen(false)
                  setModerationNote("")
                  setPublicationYear("")
                  setModerationAction(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleModerationSubmit}
                disabled={
                  isSubmitting ||
                  (moderationAction === "reject" && !moderationNote.trim()) ||
                  (moderationAction === "approve" && !publicationYear)
                }
                variant={moderationAction === "reject" ? "destructive" : "default"}
              >
                {isSubmitting
                  ? "Processing..."
                  : moderationAction === "approve"
                    ? "Approve"
                    : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
