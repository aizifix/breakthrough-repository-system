"use client"

import { useState, useEffect } from "react"
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
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  User,
  Mail,
  Building2,
  Plus,
  ArrowRight,
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
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getPublishers, approveRepository, rejectRepository, unpublishRepository } from "@/app/config/api"

interface Publisher {
  id: string
  name: string
  email: string
  avatar?: string
  institution?: string
  department?: string
  createdAt: string
  repositories: Repository[]
}

interface Repository {
  id: number | string
  title: string
  abstract: string
  category: string[] | string
  tags: string[] | string
  publishedDate: string | null
  publishedStatus: "published" | "draft" | "unpublished" | "rejected" | "pending"
  pdfUrl?: string | null
  pdfData?: string
  userId?: string
  created_at?: string
}

export default function PublishersPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [filteredPublishers, setFilteredPublishers] = useState<Publisher[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedPublishers, setExpandedPublishers] = useState<Set<string>>(new Set())
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"publish" | "unpublish" | "reject" | null>(null)
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
          loadPublishers()
        }
      } else {
        router.push("/auth/login")
      }
    }
  }, [router])

  useEffect(() => {
    filterPublishers()
  }, [searchQuery, publishers])

  const loadPublishers = async () => {
    try {
      setIsLoading(true)
      const response = await getPublishers()

      if (response.status === "success" && response.data) {
        // Format the data to match expected structure
        const formattedPublishers: Publisher[] = response.data.map((pub: any) => ({
          id: pub.id.toString(),
          name: pub.name,
          email: pub.email,
          avatar: pub.avatar || pub.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
          institution: pub.institution || null,
          department: pub.department || null,
          createdAt: pub.createdAt,
          repositories: (pub.repositories || []).map((repo: any) => ({
            ...repo,
            id: repo.id.toString(),
            category: Array.isArray(repo.category) ? repo.category : (repo.category ? (typeof repo.category === 'string' ? repo.category.split(', ') : [repo.category]) : []),
            tags: Array.isArray(repo.tags) ? repo.tags : (repo.tags ? (typeof repo.tags === 'string' ? repo.tags.split(', ') : [repo.tags]) : []),
            publishedDate: repo.publishedDate || repo.created_at || null,
          }))
        }))

        setPublishers(formattedPublishers)
      } else {
        console.error("Failed to load publishers:", response.message)
        setPublishers([])
      }
    } catch (error) {
      console.error("Error fetching publishers:", error)
      setPublishers([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterPublishers = () => {
    let filtered = [...publishers]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email.toLowerCase().includes(query) ||
          p.institution?.toLowerCase().includes(query) ||
          p.department?.toLowerCase().includes(query)
      )
    }

    setFilteredPublishers(filtered)
  }

  const togglePublisherExpansion = (publisherId: string) => {
    const newExpanded = new Set(expandedPublishers)
    if (newExpanded.has(publisherId)) {
      newExpanded.delete(publisherId)
    } else {
      newExpanded.add(publisherId)
    }
    setExpandedPublishers(newExpanded)
  }

  const handleRepositoryAction = (repo: Repository, action: "publish" | "unpublish" | "reject") => {
    setSelectedRepository(repo)
    setActionType(action)
    setIsActionDialogOpen(true)
  }

  const handleActionSubmit = async () => {
    if (!selectedRepository || !actionType) return

    setIsSubmitting(true)

    try {
      const repositoryId = typeof selectedRepository.id === 'string'
        ? parseInt(selectedRepository.id)
        : selectedRepository.id

      let response
      if (actionType === "publish") {
        response = await approveRepository(repositoryId)
      } else if (actionType === "unpublish") {
        response = await unpublishRepository(repositoryId)
      } else {
        response = await rejectRepository(repositoryId, "Rejected by admin")
      }

      if (response.status === "success") {
        // Reload publishers to reflect changes
        await loadPublishers()
        setIsActionDialogOpen(false)
        setSelectedRepository(null)
        setActionType(null)
      } else {
        alert(response.message || "Failed to update repository. Please try again.")
      }
    } catch (error) {
      console.error("Error updating repository:", error)
      alert("Failed to update repository. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 size={12} />
            Published
          </Badge>
        )
      case "unpublished":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <X size={12} />
            Unpublished
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const stats = {
    totalPublishers: publishers.length,
    totalRepositories: publishers.reduce((sum, p) => sum + p.repositories.length, 0),
    publishedRepos: publishers.reduce(
      (sum, p) => sum + p.repositories.filter((r) => r.publishedStatus === "published").length,
      0
    ),
    unpublishedRepos: publishers.reduce(
      (sum, p) => sum + p.repositories.filter((r) => r.publishedStatus === "unpublished").length,
      0
    ),
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-primary" size={28} />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Publishers</h1>
              <p className="text-muted-foreground">
                Manage publishers and their repositories
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Publishers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPublishers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Repositories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRepositories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.publishedRepos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unpublished
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unpublishedRepos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search publishers by name, email, institution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Publishers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Publishers</CardTitle>
            <CardDescription>
              {filteredPublishers.length} of {publishers.length} publishers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading publishers...</p>
              </div>
            ) : filteredPublishers.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-lg font-medium text-foreground mb-2">
                  No publishers found
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try adjusting your search" : "No publishers in the system"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPublishers.map((publisher) => {
                  const isExpanded = expandedPublishers.has(publisher.id)
                  const repoStats = {
                    total: publisher.repositories.length,
                    published: publisher.repositories.filter((r) => r.publishedStatus === "published").length,
                    unpublished: publisher.repositories.filter((r) => r.publishedStatus === "unpublished").length,
                    rejected: publisher.repositories.filter((r) => r.publishedStatus === "rejected").length,
                  }

                  return (
                    <div key={publisher.id} className="border border-border rounded-lg">
                      {/* Publisher Row */}
                      <div
                        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => togglePublisherExpansion(publisher.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePublisherExpansion(publisher.id)
                              }}
                            >
                              {isExpanded ? (
                                <Plus size={16} className="rotate-45" />
                              ) : (
                                <ArrowRight size={16} />
                              )}
                            </Button>
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-semibold">
                              {publisher.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{publisher.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Mail size={12} />
                                  {publisher.email}
                                </span>
                                {publisher.institution && (
                                  <span className="flex items-center gap-1">
                                    <Building2 size={12} />
                                    {publisher.institution}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-center">
                                <div className="font-semibold">{repoStats.total}</div>
                                <div className="text-xs text-muted-foreground">Repositories</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-green-600">{repoStats.published}</div>
                                <div className="text-xs text-muted-foreground">Published</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold text-yellow-600">{repoStats.unpublished}</div>
                                <div className="text-xs text-muted-foreground">Unpublished</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Repositories List */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20">
                          {publisher.repositories.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                              <FileText className="mx-auto mb-2" size={32} />
                              <p>No repositories yet</p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Title</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {publisher.repositories.map((repo) => (
                                  <TableRow key={repo.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{repo.title}</div>
                                        <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                          {repo.abstract}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {(Array.isArray(repo.category) ? repo.category : []).slice(0, 2).map((cat, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {cat}
                                          </Badge>
                                        ))}
                                      </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(repo.publishedStatus)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                      <div className="flex items-center gap-1">
                                        {formatDate(repo.publishedDate || repo.created_at)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            Actions
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Repository Actions</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedRepository(repo)
                                              setIsViewDialogOpen(true)
                                            }}
                                          >
                                            <Eye size={16} className="mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          {repo.publishedStatus !== "published" && (
                                            <DropdownMenuItem
                                              onClick={() => handleRepositoryAction(repo, "publish")}
                                              className="text-green-600"
                                            >
                                              <CheckCircle2 size={16} className="mr-2" />
                                              Publish
                                            </DropdownMenuItem>
                                          )}
                                          {repo.publishedStatus === "published" && (
                                            <DropdownMenuItem
                                              onClick={() => handleRepositoryAction(repo, "unpublish")}
                                              className="text-yellow-600"
                                            >
                                              <X size={16} className="mr-2" />
                                              Unpublish
                                            </DropdownMenuItem>
                                          )}
                                          {repo.publishedStatus !== "rejected" && (
                                            <DropdownMenuItem
                                              onClick={() => handleRepositoryAction(repo, "reject")}
                                              className="text-red-600"
                                            >
                                              <XCircle size={16} className="mr-2" />
                                              Reject
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Repository Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Repository Details</DialogTitle>
              <DialogDescription>View complete repository information</DialogDescription>
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
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(selectedRepository.category) ? selectedRepository.category : []).map((cat, idx) => (
                      <Badge key={idx} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(selectedRepository.tags) ? selectedRepository.tags : []).map((tag, idx) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedRepository.publishedStatus)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Published Date</Label>
                    <p className="text-sm mt-1">{formatDate(selectedRepository.publishedDate || selectedRepository.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Confirmation Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "publish" && "Publish Repository"}
                {actionType === "unpublish" && "Unpublish Repository"}
                {actionType === "reject" && "Reject Repository"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "publish" &&
                  "This repository will be published and made available to all users."}
                {actionType === "unpublish" &&
                  "This repository will be unpublished and hidden from public view."}
                {actionType === "reject" &&
                  "This repository will be rejected. The publisher will be notified."}
              </DialogDescription>
            </DialogHeader>
            {selectedRepository && (
              <div className="py-4">
                <p className="text-sm font-medium mb-2">Repository:</p>
                <p className="text-sm text-muted-foreground">{selectedRepository.title}</p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsActionDialogOpen(false)
                  setSelectedRepository(null)
                  setActionType(null)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActionSubmit}
                disabled={isSubmitting}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                {isSubmitting
                  ? "Processing..."
                  : actionType === "publish"
                    ? "Publish"
                    : actionType === "unpublish"
                      ? "Unpublish"
                      : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
