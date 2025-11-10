"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, X } from "lucide-react"

interface RepositoryViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repository: {
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
    pdfData?: string // Base64 data URL for uploaded PDFs
  } | null
  user?: { name: string; email: string } | null
}

export default function RepositoryViewModal({
  open,
  onOpenChange,
  repository,
  user,
}: RepositoryViewModalProps) {
  const router = useRouter()

  if (!repository) return null

  // Get the PDF URL - prefer pdfData (base64) if available, otherwise use pdfUrl
  const getPdfUrl = () => {
    if (repository.pdfData) {
      return repository.pdfData // Base64 data URL
    }
    // If pdfUrl starts with /uploads, prepend the API base URL
    if (repository.pdfUrl && repository.pdfUrl.startsWith('/uploads/')) {
      return `http://localhost/repository-api${repository.pdfUrl}`
    }
    return repository.pdfUrl || "/mock/Document1.pdf"
  }

  const handleDownload = () => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push("/auth/login")
      return
    }

    const pdfUrl = getPdfUrl()
    if (pdfUrl) {
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `${repository.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleLogin = () => {
    onOpenChange(false)
    router.push("/auth/login")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl w-full max-h-[90vh] p-0 flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Sticky Header */}
          <DialogHeader className="flex-shrink-0 bg-background border-b border-border p-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-foreground font-bold text-sm">
                    {repository.publisher.avatar}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">
                    {repository.publisher.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{repository.publishedDate || "Not published"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    repository.publishedStatus === "published"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : repository.publishedStatus === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                      : repository.publishedStatus === "rejected"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      : repository.publishedStatus === "unpublished"
                      ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                  }`}
                >
                  {repository.publishedStatus === "published"
                    ? "Published"
                    : repository.publishedStatus === "pending"
                    ? "Pending"
                    : repository.publishedStatus === "rejected"
                    ? "Rejected"
                    : repository.publishedStatus === "unpublished"
                    ? "Unpublished"
                    : "Draft"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8"
                  aria-label="Close modal"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground mt-4 pr-8">
              {repository.title}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {/* Category and Tags */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {repository.category.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block px-2.5 py-1 bg-secondary/20 text-secondary text-xs rounded font-medium"
                  >
                    {cat}
                  </span>
                ))}
                {repository.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Abstract Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Abstract</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {repository.abstract}
              </p>
            </div>

            {/* PDF View Section */}
            {(repository.pdfUrl || repository.pdfData) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">PDF Preview</h3>
                <div className="border border-border rounded-lg overflow-hidden bg-muted/20 relative">
                  <div className="relative h-[400px] overflow-hidden">
                    <iframe
                      src={`${getPdfUrl()}#page=1&zoom=page-fit&toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full border-0 pointer-events-none"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        overflow: 'hidden',
                        userSelect: 'none',
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
                          Download to see view details
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Sticky Footer */}
        <DialogFooter className="flex-shrink-0 bg-background border-t border-border p-6 pt-4">
          <div className="flex gap-3 w-full justify-end">
            {user ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button onClick={handleDownload} className="gap-2">
                  <Download size={16} />
                  Download PDF
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLogin} className="gap-2">
                  Login
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
