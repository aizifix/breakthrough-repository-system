"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck, Download, Eye } from "lucide-react"

interface RepositoryCardProps {
  id: string
  title: string
  abstract: string
  publisher: {
    name: string
    avatar: string
  }
  category: string[]
  tags: string[]
  publishedDate: string | null
  publishedStatus: "published" | "draft" | "unpublished" | "pending" | "rejected"
  pdfUrl?: string
  onViewClick?: () => void
  user?: { name: string; email: string } | null
  detailPath?: string // Optional custom path for detail page link
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
}: RepositoryCardProps) {
  const router = useRouter()
  const [isBookmarked, setIsBookmarked] = useState(false)

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
      className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header with Publisher Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <span className="text-accent-foreground font-bold text-sm">{publisher.avatar}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{publisher.name}</p>
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
      <div className="flex-1 mb-4">
        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{abstract}</p>
      </div>

      {/* Category and Tags */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {category.map((cat) => (
            <span
              key={cat}
              className="inline-block px-2.5 py-1 bg-secondary/20 text-secondary text-xs rounded font-medium"
            >
              {cat}
            </span>
          ))}
          {tags.map((tag) => (
            <span key={tag} className="inline-block px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  )
}
