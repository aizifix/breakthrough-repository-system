"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, FileText, Download, Trash2, X, CheckCircle2 } from "lucide-react"
import RepositorySocialFeatures from "@/components/repository-social-features"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// interface PlagiarismData {
//   overallScore: number
//   status: "passed" | "warning" | "failed"
//   checks: Array<{ name: string; score: number; status: "passed" | "failed" }>
//   lastChecked: string
//   provider?: string
//   note?: string
// }

interface Repository {
  id: number | string
  title: string
  abstract: string
  publisher: number | {
    name: string
    avatar: string
    isVerified?: boolean
  }
  category: string[]
  keywords: string[]
  publishedDate: string | null
  publishedStatus: "pending" | "published" | "rejected" | "unpublished" | "draft"
  pdfUrl?: string
  pdfData?: string // Base64 data URL for uploaded PDFs
  userId?: string
  publisher_name?: string
  publisher_email?: string
  publisherId?: number // Store original publisher ID for ownership check
}

export default function ResearchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<{ name: string; email: string; userId?: number; user_id?: number } | null>(null)
  const [research, setResearch] = useState<Repository | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  // const [plagiarismData, setPlagiarismData] = useState<PlagiarismData | null>(null)
  // const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false)
  // const [plagiarismError, setPlagiarismError] = useState<string | null>(null)

  // Edit states
  const [editingField, setEditingField] = useState<"title" | "abstract" | "categories" | "keywords" | "pdf" | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editAbstract, setEditAbstract] = useState("")
  const [editCategories, setEditCategories] = useState<string[]>([])
  const [editKeywords, setEditKeywords] = useState<string[]>([])
  const [editKeywordInput, setEditKeywordInput] = useState("")
  const [editCategoryInput, setEditCategoryInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const viewIncrementedRef = useRef(false)

  // Load user and repository from API
  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        // Load user
        const stored = localStorage.getItem("user")
        if (stored) {
          try {
            const userData = JSON.parse(stored)
            setUser(userData)
          } catch (e) {
            router.push("/auth/login")
            return
          }
        } else {
          router.push("/auth/login")
          return
        }

        // Load repository from API
        const researchId = params?.id as string
        if (!researchId) {
          setIsLoading(false)
          return
        }

        try {
          // Increment view count only once per page load
          // Use sessionStorage to prevent duplicate increments even on remounts
          const viewKey = `view_incremented_${researchId}`
          const hasIncremented = sessionStorage.getItem(viewKey)

          if (!hasIncremented && !viewIncrementedRef.current) {
            viewIncrementedRef.current = true
            try {
              await fetch("http://localhost/repository-api/publisher.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  operation: "increment_view",
                  repository_id: researchId,
                }),
              })
              // Mark as incremented in sessionStorage
              sessionStorage.setItem(viewKey, "true")
            } catch (viewError) {
              console.error("Error incrementing view count:", viewError)
              // Reset ref on error so it can retry
              viewIncrementedRef.current = false
            }
          }

          // Then fetch repository data
          const response = await fetch("http://localhost/repository-api/publisher.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operation: "get_repository",
              repository_id: researchId,
            }),
          })

          const result = await response.json()

          if (result.status === "success" && result.data) {
            const repo = result.data
            // Store original publisher ID for ownership check
            const originalPublisherId = repo.publisher

            // Format repository to match expected structure
            const formattedRepo: Repository = {
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
                isVerified: repo.publisher_is_verified ?? false,
              },
              category: Array.isArray(repo.category)
                ? repo.category.filter((c: string) => c && c.trim())
                : (repo.category ? [repo.category].filter((c: string) => c && c.trim()) : []),
              keywords: Array.isArray(repo.tags)
                ? repo.tags.filter((t: string) => t && t.trim())
                : (repo.tags ? [repo.tags].filter((t: string) => t && t.trim()) : []),
              // Store original publisher ID for ownership check
              publisherId: originalPublisherId,
            }
            setResearch(formattedRepo)
          } else {
            console.error("Repository not found:", result)
          }
        } catch (error) {
          console.error("Error fetching repository:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadData()
  }, [params?.id, router])

  // Trigger plagiarism check (runs automatically on load and can be triggered manually)
  // const handleCheckPlagiarism = async (forceRecheck = false) => {
  //   if (!research || !research.id) return

  //   setIsCheckingPlagiarism(true)
  //   setPlagiarismError(null)

  //   try {
  //     const response = await fetch("http://localhost/repository-api/publisher.php", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         operation: "check_plagiarism",
  //         repository_id: research.id,
  //         force_recheck: forceRecheck,
  //       }),
  //     })

  //     const result = await response.json()

  //     if (result.status === "success" && result.data) {
  //       setPlagiarismData(result.data)
  //       setPlagiarismError(null)
  //       // If results were cached, loading state was very brief, so we can hide it immediately
  //       if (result.cached) {
  //         setIsCheckingPlagiarism(false)
  //       }
  //     } else {
  //       setPlagiarismError(result.message || "Failed to check plagiarism")
  //       setIsCheckingPlagiarism(false)
  //     }
  //   } catch (error) {
  //     console.error("Error checking plagiarism:", error)
  //     setPlagiarismError("Failed to check plagiarism. Please try again.")
  //     setIsCheckingPlagiarism(false)
  //   } finally {
  //     // Only set loading to false if not already set (for cached results)
  //     setTimeout(() => setIsCheckingPlagiarism(false), 100)
  //   }
  // }

  // Automatically check plagiarism when research is loaded
  // useEffect(() => {
  //   if (research && research.id) {
  //     handleCheckPlagiarism()
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [research?.id])

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!research) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Research Not Found</h1>
        <Button onClick={() => router.push("/publisher/my-repository")}>Go Back to My Repository</Button>
      </div>
    )
  }

  // Get the PDF URL - prefer pdfData (base64) if available, otherwise use pdfUrl
  const getPdfUrl = () => {
    if (research.pdfData) {
      return research.pdfData // Base64 data URL
    }
    // If pdfUrl starts with /uploads, prepend the API base URL
    if (research.pdfUrl && research.pdfUrl.startsWith('/uploads/')) {
      return `http://localhost/repository-api${research.pdfUrl}`
    }
    return research.pdfUrl || "/mock/Document1.pdf"
  }

  const handleDownload = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const pdfUrl = getPdfUrl()
    if (pdfUrl) {
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `${research.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleDelete = async () => {
    if (!user || !research) return

    // Get user ID
    const userId = (user as any).userId || (user as any).user_id
    if (!userId) {
      alert("User information not found. Please login again.")
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "delete_repository",
          repository_id: research.id,
          user_id: userId,
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        // Dispatch event to notify other components
        window.dispatchEvent(new Event("repositoryDeleted"))

        // Navigate back to my-repository list
        router.push("/publisher/my-repository")
      } else {
        alert(result.message || "Failed to delete repository. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting repository:", error)
      alert("Failed to delete repository. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  // Check if the current user owns this repository
  const userId = user ? ((user as any).userId || (user as any).user_id) : null
  const isOwner = userId && research && research.publisherId === userId
  // Check if repository can be edited (only pending or unpublished)
  const canEdit = isOwner && research && ["pending", "unpublished"].includes(research.publishedStatus)

  // Open edit dialog for a field
  const openEditDialog = (field: "title" | "abstract" | "categories" | "keywords" | "pdf") => {
    if (!research || !canEdit) return

    setEditingField(field)
    if (field === "title") {
      setEditTitle(research.title)
    } else if (field === "abstract") {
      setEditAbstract(research.abstract)
    } else if (field === "categories") {
      setEditCategories([...research.category])
      setEditCategoryInput("")
    } else if (field === "keywords") {
      setEditKeywords([...research.keywords])
      setEditKeywordInput("")
    } else if (field === "pdf") {
      setSelectedPdfFile(null)
    }
  }

  // Add category
  const addCategory = () => {
    if (editCategoryInput.trim() && !editCategories.includes(editCategoryInput.trim())) {
      setEditCategories([...editCategories, editCategoryInput.trim()])
      setEditCategoryInput("")
    }
  }

  // Remove category
  const removeCategory = (cat: string) => {
    setEditCategories(editCategories.filter((c) => c !== cat))
  }

  // Add keyword
  const addKeyword = () => {
    if (editKeywordInput.trim() && !editKeywords.includes(editKeywordInput.trim())) {
      setEditKeywords([...editKeywords, editKeywordInput.trim()])
      setEditKeywordInput("")
    }
  }

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setEditKeywords(editKeywords.filter((k) => k !== keyword))
  }

  // Save changes
  const handleSave = async () => {
    if (!research || !user || !canEdit) return

    const userId = (user as any).userId || (user as any).user_id
    if (!userId) {
      alert("User information not found. Please login again.")
      return
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append("operation", "update_repository")
      formData.append("repository_id", research.id.toString())
      formData.append("publisher", userId.toString())

      if (editingField === "title") {
        formData.append("title", editTitle)
        formData.append("abstract", research.abstract)
        formData.append("category", research.category.join(", "))
        formData.append("tags", research.keywords.join(", "))
      } else if (editingField === "abstract") {
        formData.append("title", research.title)
        formData.append("abstract", editAbstract)
        formData.append("category", research.category.join(", "))
        formData.append("tags", research.keywords.join(", "))
      } else if (editingField === "categories") {
        formData.append("title", research.title)
        formData.append("abstract", research.abstract)
        formData.append("category", editCategories.join(", "))
        formData.append("tags", research.keywords.join(", "))
      } else if (editingField === "keywords") {
        formData.append("title", research.title)
        formData.append("abstract", research.abstract)
        formData.append("category", research.category.join(", "))
        formData.append("tags", editKeywords.join(", "))
      } else if (editingField === "pdf") {
        formData.append("title", research.title)
        formData.append("abstract", research.abstract)
        formData.append("category", research.category.join(", "))
        formData.append("tags", research.keywords.join(", "))
        if (selectedPdfFile) {
          formData.append("pdfFile", selectedPdfFile)
        }
      }

      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.status === "success") {
        // Reload repository data
        const reloadResponse = await fetch("http://localhost/repository-api/publisher.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "get_repository",
            repository_id: research.id,
          }),
        })

        const reloadResult = await reloadResponse.json()

        if (reloadResult.status === "success" && reloadResult.data) {
          const repo = reloadResult.data
          const originalPublisherId = repo.publisher

          const formattedRepo: Repository = {
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
            category: Array.isArray(repo.category)
              ? repo.category.filter((c: string) => c && c.trim())
              : (repo.category ? [repo.category].filter((c: string) => c && c.trim()) : []),
            keywords: Array.isArray(repo.tags)
              ? repo.tags.filter((t: string) => t && t.trim())
              : (repo.tags ? [repo.tags].filter((t: string) => t && t.trim()) : []),
            publisherId: originalPublisherId,
          }
          setResearch(formattedRepo)
        }

        setEditingField(null)
        alert("Repository updated successfully!")
      } else {
        alert(result.message || "Failed to update repository. Please try again.")
      }
    } catch (error) {
      console.error("Error updating repository:", error)
      alert("Failed to update repository. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/publisher/my-repository">My Repository</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate">{research.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Back Button and Delete Button */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft size={16} />
            Back
          </Button>
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={isDeleting}>
                  <Trash2 size={16} />
                  {isDeleting ? "Deleting..." : "Delete Repository"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this repository?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the repository
                    "{research.title}" and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Publisher Info */}
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-accent-foreground font-bold text-lg">
                  {typeof research.publisher === 'object' ? research.publisher.avatar : 'U'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-lg">
                    {typeof research.publisher === 'object' ? research.publisher.name : 'Unknown Publisher'}
                  </p>
                  {typeof research.publisher === 'object' && research.publisher.isVerified && (
                    <CheckCircle2 size={18} className="text-primary shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{research.publishedDate || "Not published"}</p>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  research.publishedStatus === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : research.publishedStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                    : research.publishedStatus === "rejected"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                {research.publishedStatus === "published"
                  ? "Published"
                  : research.publishedStatus === "pending"
                  ? "Pending"
                  : research.publishedStatus === "rejected"
                  ? "Rejected"
                  : research.publishedStatus === "unpublished"
                  ? "Unpublished"
                  : "Draft"}
              </span>
            </div>

            {/* Title */}
            <div className="group relative">
              <h1 className="text-2xl font-bold text-foreground pr-10">{research.title}</h1>
              {canEdit && (
                <button
                  onClick={() => openEditDialog("title")}
                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-md"
                  title="Edit title"
                >
                  <FileText size={18} className="text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Category and Tags */}
            <div className="space-y-3">
              <div className="group relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Categories</h3>
                  {canEdit && (
                    <button
                      onClick={() => openEditDialog("categories")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md"
                      title="Edit categories"
                    >
                      <FileText size={16} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {research.category.map((cat) => (
                    <span
                      key={cat}
                      className="inline-block px-3 py-1.5 bg-secondary/20 text-secondary text-sm rounded font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className="group relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Keywords</h3>
                  {canEdit && (
                    <button
                      onClick={() => openEditDialog("keywords")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md"
                      title="Edit keywords"
                    >
                      <FileText size={16} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {research.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-block px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Abstract */}
            <div className="group relative">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-foreground">Abstract</h2>
                {canEdit && (
                  <button
                    onClick={() => openEditDialog("abstract")}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md"
                    title="Edit abstract"
                  >
                    <FileText size={18} className="text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{research.abstract}</p>
            </div>

            {/* PDF Preview */}
            {(research.pdfUrl || research.pdfData) && (
              <div className="group relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">PDF Preview</h2>
                  {canEdit && (
                    <button
                      onClick={() => openEditDialog("pdf")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-md"
                      title="Replace PDF"
                    >
                      <FileText size={18} className="text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </div>
                <div className="border border-border rounded-lg overflow-hidden bg-muted/20 relative">
                  <div className="relative h-[600px] overflow-hidden">
                    <iframe
                      src={`${getPdfUrl()}#page=1&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0 pointer-events-none"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        overflow: "hidden",
                        userSelect: "none",
                      }}
                      title="PDF Preview"
                      scrolling="no"
                    />
                    {/* Gradient fade overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                    {/* Download message */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
                      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-lg">
                        <p className="text-sm font-medium text-foreground text-center">
                          {user ? "Download to see full details" : "Login to download full PDF"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="pt-4">
              {user ? (
                <Button onClick={handleDownload} size="lg" className="gap-2">
                  <Download size={20} />
                  Download PDF
                </Button>
              ) : (
                <Button onClick={() => router.push("/auth/login")} size="lg" className="gap-2">
                  Login to Download
                </Button>
              )}
            </div>

            {/* Social Features: Ratings, Likes, Comments, Share */}
            <div className="pt-8 border-t border-border mt-8">
              <RepositorySocialFeatures
                repositoryId={research.id}
                userId={userId}
                user={user}
              />
            </div>
          </div>

          {/* Edit Dialogs */}
          <Dialog open={editingField === "title"} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Title</DialogTitle>
                <DialogDescription>Update the title of your repository.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2"
                  placeholder="Enter repository title"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingField(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !editTitle.trim()}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editingField === "abstract"} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Abstract</DialogTitle>
                <DialogDescription>Update the abstract of your repository.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="edit-abstract">Abstract</Label>
                <Textarea
                  id="edit-abstract"
                  value={editAbstract}
                  onChange={(e) => setEditAbstract(e.target.value)}
                  className="mt-2 min-h-[200px]"
                  placeholder="Enter repository abstract"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingField(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !editAbstract.trim()}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editingField === "categories"} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Categories</DialogTitle>
                <DialogDescription>Add or remove categories for your repository.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={editCategoryInput}
                    onChange={(e) => setEditCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCategory()
                      }
                    }}
                    placeholder="Enter category name"
                  />
                  <Button onClick={addCategory} type="button" variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md">
                  {editCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories added yet</p>
                  ) : (
                    editCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary/20 text-secondary text-sm rounded font-medium"
                      >
                        {cat}
                        <button
                          onClick={() => removeCategory(cat)}
                          className="ml-1 hover:text-destructive"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingField(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editingField === "keywords"} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Keywords</DialogTitle>
                <DialogDescription>Add or remove keywords for your repository.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={editKeywordInput}
                    onChange={(e) => setEditKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addKeyword()
                      }
                    }}
                    placeholder="Enter keyword name"
                  />
                  <Button onClick={addKeyword} type="button" variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md">
                  {editKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No keywords added yet</p>
                  ) : (
                    editKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded"
                      >
                        #{keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 hover:text-destructive"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingField(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={editingField === "pdf"} onOpenChange={(open) => !open && setEditingField(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Replace PDF</DialogTitle>
                <DialogDescription>Upload a new PDF file to replace the current one.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="edit-pdf">PDF File</Label>
                <Input
                  id="edit-pdf"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Allow files larger than 10MB (up to 500MB)
                      if (file.size > 500 * 1024 * 1024) {
                        alert("File size must be less than 500MB")
                        return
                      }
                      setSelectedPdfFile(file)
                    }
                  }}
                  className="mt-2"
                />
                {selectedPdfFile && (
                  <p className="mt-2 text-sm text-muted-foreground">Selected: {selectedPdfFile.name}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingField(null)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving || !selectedPdfFile}>
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Sidebar - Plagiarism Check - COMMENTED OUT */}
          {/*
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <FileText size={20} />
                Plagiarism Check
              </h3>
            </div>
          </div>
          */}
        </div>
      </div>
  )
}
