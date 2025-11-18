"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Download, Eye, Heart, Star, CheckCircle2, Edit2, Trash2 } from "lucide-react"

interface RepositoryCardProps {
  id: string
  title: string
  abstract: string
  publisher: {
    name: string
    avatar: string
    isVerified?: boolean
  }
  category: string[]
  tags: string[]
  publishedDate: string | null
  publishedStatus: "published" | "draft" | "unpublished" | "pending" | "rejected"
  pdfUrl?: string
  onViewClick?: () => void
  user?: { name: string; email: string; userId?: number; user_id?: number } | null
  detailPath?: string // Optional custom path for detail page link
  publisherId?: number // Publisher ID to check if user owns the repository
  views?: number
  likes?: number
  isLiked?: boolean
  rating?: number
  ratingCount?: number
}

export default function RepositoryCard({
  id,
  title,
  abstract,
  publisher,
  category,
  tags,
  publishedDate,
  publishedStatus,
  pdfUrl,
  onViewClick,
  user,
  detailPath,
  publisherId,
  views = 0,
  likes = 0,
  isLiked = false,
  rating = 0,
  ratingCount = 0,
}: RepositoryCardProps) {
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Check if repository is saved on mount
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const savedKey = `savedRepositories_${user.email}`
      const savedIds = localStorage.getItem(savedKey)
      if (savedIds) {
        const saved = JSON.parse(savedIds)
        setIsBookmarked(saved.includes(id))
      }
    }
  }, [id, user])

  // Listen for bookmark changes from other components
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const handleBookmarkChange = () => {
        const savedKey = `savedRepositories_${user.email}`
        const savedIds = localStorage.getItem(savedKey)
        if (savedIds) {
          const saved = JSON.parse(savedIds)
          setIsBookmarked(saved.includes(id))
        } else {
          setIsBookmarked(false)
        }
      }

      window.addEventListener("repositorySaved", handleBookmarkChange)
      window.addEventListener("repositoryUnsaved", handleBookmarkChange)
      window.addEventListener("storage", handleBookmarkChange)

      return () => {
        window.removeEventListener("repositorySaved", handleBookmarkChange)
        window.removeEventListener("repositoryUnsaved", handleBookmarkChange)
        window.removeEventListener("storage", handleBookmarkChange)
      }
    }
  }, [id, user])

  // Lazy loading with Intersection Observer
  useEffect(() => {
    if (!cardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: "50px", // Start loading 50px before the card enters viewport
        threshold: 0.01,
      }
    )

    observer.observe(cardRef.current)

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current)
      }
    }
  }, [])

  const checkAuth = () => {
    if (!user) {
      router.push("/auth/login")
      return false
    }
    return true
  }


  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!checkAuth()) return

    if (pdfUrl) {
      // If pdfUrl starts with /uploads, prepend the API base URL
      const finalUrl = pdfUrl.startsWith('/uploads/')
        ? `http://localhost/repository-api${pdfUrl}`
        : pdfUrl

      const link = document.createElement("a")
      link.href = finalUrl
      link.download = `${title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleCardClick = () => {
    const path = detailPath ? `${detailPath}/${id}` : `/research/${id}`
    router.push(path)
  }

  // Check if user owns this repository
  const userId = user ? ((user as any).userId || (user as any).user_id) : null
  const isOwner = userId && publisherId && userId === publisherId
  // Check if repository can be edited/deleted (only pending or unpublished)
  const canEditOrDelete = isOwner && ["pending", "unpublished"].includes(publishedStatus)

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!checkAuth() || !canEditOrDelete) return
    const path = detailPath ? `${detailPath}/${id}` : `/publisher/my-repository/${id}`
    router.push(path)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!checkAuth() || !canEditOrDelete || !user) return

    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    const userId = (user as any).userId || (user as any).user_id
    if (!userId) {
      alert("User information not found. Please login again.")
      return
    }

    try {
      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "delete_repository",
          repository_id: id,
          user_id: userId,
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        // Dispatch event to notify other components
        window.dispatchEvent(new Event("repositoryDeleted"))
        // Reload the page or remove the card
        window.location.reload()
      } else {
        alert(result.message || "Failed to delete repository. Please try again.")
      }
    } catch (error) {
      console.error("Error deleting repository:", error)
      alert("Failed to delete repository. Please try again.")
    }
  }

  const handleView = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    // Allow viewing modal even when not logged in
    if (onViewClick) {
      onViewClick()
    }
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!checkAuth() || !user) return

    const savedKey = `savedRepositories_${user.email}`
    const savedIds = localStorage.getItem(savedKey)
    const saved = savedIds ? JSON.parse(savedIds) : []

    if (isBookmarked) {
      // Remove from saved
      const updated = saved.filter((savedId: string) => savedId !== id)
      localStorage.setItem(savedKey, JSON.stringify(updated))
      setIsBookmarked(false)
      // Dispatch event to notify other components
      window.dispatchEvent(new Event("repositoryUnsaved"))
    } else {
      // Add to saved
      if (!saved.includes(id)) {
        saved.push(id)
        localStorage.setItem(savedKey, JSON.stringify(saved))
        setIsBookmarked(true)
        // Dispatch event to notify other components
        window.dispatchEvent(new Event("repositorySaved"))
      }
    }
  }

  return (
    <div
      ref={cardRef}
      className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer relative"
      onClick={handleCardClick}
    >
      {!isVisible ? (
        <div className="absolute inset-0 bg-muted/50 animate-pulse rounded-lg flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      ) : null}
      <div className={isVisible ? "opacity-100 transition-opacity duration-300 flex flex-col h-full" : "opacity-0 flex flex-col h-full"}>
        {/* Header with Publisher Info */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <span className="text-accent-foreground font-bold text-sm">{publisher.avatar}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-foreground text-sm truncate">{publisher.name}</p>
                {publisher.isVerified && (
                  <CheckCircle2 size={14} className="text-primary flex-shrink-0" title="Verified user" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{publishedDate || "Not published"}</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                publishedStatus === "published"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : publishedStatus === "pending"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : publishedStatus === "rejected"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : publishedStatus === "unpublished"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
              }`}
            >
              {publishedStatus === "published"
                ? "Published"
                : publishedStatus === "pending"
                ? "Pending"
                : publishedStatus === "rejected"
                ? "Rejected"
                : publishedStatus === "unpublished"
                ? "Unpublished"
                : "Draft"}
            </span>
          </div>
        </div>

        {/* Title and Abstract */}
        <div className="flex-1 mb-4 min-h-0">
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 hover:text-accent transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{abstract}</p>
        </div>

        {/* Category and Keywords */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {category.map((cat) => (
              <span
                key={cat}
                className="inline-block px-2.5 py-1 bg-secondary/20 text-secondary text-xs rounded font-medium"
              >
                {cat}
              </span>
            ))}
            {tags.slice(0, 3).map((keyword) => (
              <span key={keyword} className="inline-block px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded">
                #{keyword}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="inline-block px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Stats: Views, Likes, Rating */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            <span>{views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart size={14} className={isLiked ? "fill-primary text-primary" : ""} />
            <span>{likes.toLocaleString()}</span>
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              {ratingCount > 0 && <span className="text-muted-foreground/70">({ratingCount})</span>}
            </div>
          )}
        </div>

        {/* Actions - Always at bottom */}
        <div className="flex gap-2 pt-4 border-t border-border mt-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 bg-transparent"
            onClick={handleView}
            aria-label="View repository"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 bg-transparent"
            onClick={handleDownload}
            aria-label="Download PDF"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download</span>
          </Button>
          {canEditOrDelete && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent text-primary hover:text-primary hover:bg-primary/10"
                onClick={handleEdit}
                aria-label="Edit repository"
                title="Edit repository"
              >
                <Edit2 size={16} />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                aria-label="Delete repository"
                title="Delete repository"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </>
          )}
          {!canEditOrDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 bg-transparent"
              onClick={handleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarked ? (
                <>
                  <BookmarkCheck size={16} />
                  <span className="hidden sm:inline">Saved</span>
                </>
              ) : (
                <>
                  <Bookmark size={16} />
                  <span className="hidden sm:inline">Save</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
