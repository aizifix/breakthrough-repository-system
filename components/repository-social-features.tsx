"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Heart, MessageCircle, Share2, Trash2, Send } from "lucide-react"
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

interface RatingData {
  userRating: number | null
  averageRating: number
  totalRatings: number
  distribution: {
    "5": number
    "4": number
    "3": number
    "2": number
    "1": number
  }
}

interface LikeData {
  isLiked: boolean
  likeCount: number
}

interface Comment {
  id: number
  comment: string
  parentCommentId: number | null
  createdAt: string
  updatedAt: string
  user: {
    id: number
    name: string
    email: string
  }
}

interface RepositorySocialFeaturesProps {
  repositoryId: string | number
  userId?: number | string | null
  user?: { name: string; email: string; userId?: number; user_id?: number } | null
}

export default function RepositorySocialFeatures({
  repositoryId,
  userId,
  user,
}: RepositorySocialFeaturesProps) {
  const [ratingData, setRatingData] = useState<RatingData | null>(null)
  const [likeData, setLikeData] = useState<LikeData | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  // Load all social data
  useEffect(() => {
    const loadSocialData = async () => {
      if (!repositoryId) return

      try {
        setIsLoading(true)

        // Load ratings
        const ratingsResponse = await fetch("http://localhost/repository-api/publisher.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "get_repository_ratings",
            repository_id: repositoryId,
            user_id: userId || null,
          }),
        })
        const ratingsResult = await ratingsResponse.json()
        if (ratingsResult.status === "success") {
          setRatingData(ratingsResult.data)
        }

        // Load likes
        const likesResponse = await fetch("http://localhost/repository-api/publisher.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "get_repository_likes",
            repository_id: repositoryId,
            user_id: userId || null,
          }),
        })
        const likesResult = await likesResponse.json()
        if (likesResult.status === "success") {
          setLikeData(likesResult.data)
        }

        // Load comments
        const commentsResponse = await fetch("http://localhost/repository-api/publisher.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operation: "get_repository_comments",
            repository_id: repositoryId,
            limit: 50,
            offset: 0,
          }),
        })
        const commentsResult = await commentsResponse.json()
        if (commentsResult.status === "success") {
          setComments(commentsResult.data.comments || [])
        }
      } catch (error) {
        console.error("Error loading social data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSocialData()
  }, [repositoryId, userId])

  // Handle rating
  const handleRate = async (rating: number) => {
    if (!user || !userId) {
      alert("Please login to rate repositories")
      return
    }

    try {
      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "rate_repository",
          repository_id: repositoryId,
          user_id: userId,
          rating: rating,
        }),
      })

      const result = await response.json()
      if (result.status === "success") {
        setRatingData(result.data)
      } else {
        alert(result.message || "Failed to submit rating")
      }
    } catch (error) {
      console.error("Error rating repository:", error)
      alert("Failed to submit rating. Please try again.")
    }
  }

  // Handle like toggle
  const handleToggleLike = async () => {
    if (!user || !userId) {
      alert("Please login to like repositories")
      return
    }

    try {
      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "toggle_like",
          repository_id: repositoryId,
          user_id: userId,
        }),
      })

      const result = await response.json()
      if (result.status === "success") {
        setLikeData(result.data)
      } else {
        alert(result.message || "Failed to toggle like")
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      alert("Failed to toggle like. Please try again.")
    }
  }

  // Handle add comment
  const handleAddComment = async () => {
    if (!user || !userId) {
      alert("Please login to comment")
      return
    }

    if (!newComment.trim()) {
      alert("Please enter a comment")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "add_comment",
          repository_id: repositoryId,
          user_id: userId,
          comment: newComment.trim(),
        }),
      })

      const result = await response.json()
      if (result.status === "success") {
        setComments([result.data, ...comments])
        setNewComment("")
      } else {
        alert(result.message || "Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Failed to add comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!user || !userId) {
      return
    }

    try {
      const response = await fetch("http://localhost/repository-api/publisher.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "delete_comment",
          comment_id: commentId,
          user_id: userId,
        }),
      })

      const result = await response.json()
      if (result.status === "success") {
        setComments(comments.filter((c) => c.id !== commentId))
      } else {
        alert(result.message || "Failed to delete comment")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      alert("Failed to delete comment. Please try again.")
    }
  }

  // Handle share
  const handleShare = async () => {
    const url = window.location.href
    const title = document.title

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: url,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed")
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert("Link copied to clipboard!")
      } catch (error) {
        // Fallback: show URL
        prompt("Copy this link:", url)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  const getUserAvatar = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ratings Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Rate this Repository</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const currentRating = hoveredStar || ratingData?.userRating || 0
              const isFilled = star <= currentRating
              return (
                <button
                  key={star}
                  onClick={() => user && userId && handleRate(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  disabled={!user || !userId}
                  className={`transition-colors ${
                    user && userId ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-50"
                  }`}
                  title={user && userId ? `Rate ${star} star${star > 1 ? "s" : ""}` : "Login to rate"}
                >
                  <Star
                    size={32}
                    className={isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
                  />
                </button>
              )
            })}
          </div>
          {ratingData && (
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{ratingData.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({ratingData.totalRatings} rating{ratingData.totalRatings !== 1 ? "s" : ""})</span>
              </div>
            </div>
          )}
        </div>
        {!user && (
          <p className="text-sm text-muted-foreground">Please login to rate this repository</p>
        )}
      </div>

      {/* Likes and Share Section */}
      <div className="flex items-center gap-4">
        <Button
          variant={likeData?.isLiked ? "default" : "outline"}
          onClick={handleToggleLike}
          disabled={!user || !userId}
          className="gap-2"
        >
          <Heart size={18} className={likeData?.isLiked ? "fill-primary text-primary" : ""} />
          {likeData?.likeCount || 0} Like{likeData && likeData.likeCount !== 1 ? "s" : ""}
        </Button>
        <Button variant="outline" onClick={handleShare} className="gap-2">
          <Share2 size={18} />
          Share
        </Button>
      </div>

      {/* Comments Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Comments ({comments.length})
        </h3>

        {/* Add Comment Form */}
        {user && userId ? (
          <div className="mb-6 space-y-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] bg-background border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleAddComment()
                }
              }}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()} className="gap-2">
                <Send size={16} />
                {isSubmitting ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-muted/50 border border-border rounded-md">
            <p className="text-sm text-muted-foreground">Please login to add a comment</p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => {
              const isOwner = user && userId && (comment.user.id === Number(userId))
              return (
                <div key={comment.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="text-accent-foreground font-bold text-sm">
                      {getUserAvatar(comment.user.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-semibold text-foreground text-sm">{comment.user.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatDate(comment.createdAt)}</span>
                      </div>
                      {isOwner && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Trash2 size={14} className="text-muted-foreground" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this comment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteComment(comment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
