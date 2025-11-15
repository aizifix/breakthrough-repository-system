"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import RepositoryCard from "@/components/repository-card"
import RepositoryViewModal from "@/components/repository-view-modal"
import FilterPanel, { type FilterState } from "@/components/filter-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Menu, Search, FileText } from "lucide-react"
import { getPublisherRepositories } from "@/app/config/api"

interface Repository {
  id: number | string
  title: string
  abstract: string
  publisher: number | {
    name: string
    avatar: string
  }
  category: string[]
  keywords: string[]
  publishedDate: string | null
  publishedStatus: "pending" | "published" | "rejected" | "unpublished"
  pdfUrl?: string
  pdfData?: string // Base64 data URL for uploaded PDFs
  userId?: string
  publisher_name?: string
  publisher_email?: string
  created_at?: string
}

export default function MyRepositoriesPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string; userId?: number; user_id?: number } | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    researchTypes: [],
    yearFrom: "",
    yearTo: "",
    keywords: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load user and fetch repositories from API
  useEffect(() => {
    const loadData = async () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user")
        if (stored) {
          try {
            const userData = JSON.parse(stored)
            setUser(userData)

            // Fetch repositories from API
            // Check for userId (from login) or user_id (from API)
            const userId = userData.userId || userData.user_id

             if (userId) {
               try {
                 const response = await getPublisherRepositories(userId, userId)

                 if (response.status === "success" && response.data) {
                   // Format repositories to match expected structure
                   const formattedRepos = response.data.map((repo: any) => ({
                     ...repo,
                     id: repo.id.toString(), // Ensure id is string for RepositoryCard
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
                     // Ensure category and keywords are arrays
                     category: Array.isArray(repo.category) ? repo.category : (repo.category ? [repo.category] : []),
                     keywords: Array.isArray(repo.tags) ? repo.tags : (repo.tags ? [repo.tags] : []),
                     views: repo.views ?? 0,
                     likes: repo.likes ?? 0,
                     isLiked: repo.isLiked ?? false,
                     rating: repo.rating ?? 0,
                     ratingCount: repo.rating_count ?? 0,
                   }))
                   setRepositories(formattedRepos)
                 } else {
                   setRepositories([])
                   if (response.message) {
                     console.error("API Error:", response.message)
                   }
                 }
               } catch (error: any) {
                 console.error("Error fetching repositories:", error)
                 setRepositories([])
                 if (error.response) {
                   console.error("Response error:", error.response.data)
                 } else if (error.request) {
                   console.error("Request error:", error.request)
                 }
               }
             }
          } catch (e) {
            router.push("/auth/login")
          }
        } else {
          router.push("/auth/login")
        }
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  // Refresh repositories when needed
  const refreshRepositories = async () => {
    // Check for userId (from login) or user_id (from API)
    const userId = (user as any)?.userId || (user as any)?.user_id

     if (userId) {
       try {
         const response = await getPublisherRepositories(userId)

         if (response.status === "success" && response.data) {
           const formattedRepos = response.data.map((repo: any) => ({
             ...repo,
             id: repo.id.toString(), // Ensure id is string for RepositoryCard
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
             // Ensure category and keywords are arrays
             category: Array.isArray(repo.category) ? repo.category : (repo.category ? [repo.category] : []),
             keywords: Array.isArray(repo.tags) ? repo.tags : (repo.tags ? [repo.tags] : []),
             views: repo.views ?? 0,
             likes: repo.likes ?? 0,
             isLiked: repo.isLiked ?? false,
             rating: repo.rating ?? 0,
             ratingCount: repo.rating_count ?? 0,
           }))
           setRepositories(formattedRepos)
         } else {
           setRepositories([])
         }
       } catch (error: any) {
         console.error("Error fetching repositories:", error)
         setRepositories([])
       }
     }
  }

  // Listen for focus event to refresh data
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      const handleFocus = () => {
        refreshRepositories()
      }
      window.addEventListener("focus", handleFocus)
      return () => window.removeEventListener("focus", handleFocus)
    }
  }, [user])

  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      // Filter by keywords
      if (filters.keywords) {
        const query = filters.keywords.toLowerCase()
        const matches =
          repo.title.toLowerCase().includes(query) ||
          repo.abstract.toLowerCase().includes(query) ||
          repo.keywords.some((keyword) => keyword.toLowerCase().includes(query)) ||
          repo.category.some((cat) => cat.toLowerCase().includes(query))
        if (!matches) return false
      }


      // Filter by year range
      if (repo.publishedDate) {
        const repoYear = parseInt(repo.publishedDate.split("-")[0])
        if (filters.yearFrom && repoYear < parseInt(filters.yearFrom)) {
          return false
        }
        if (filters.yearTo && repoYear > parseInt(filters.yearTo)) {
          return false
        }
      }

      return true
    })
  }, [repositories, filters])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">My Repository</h1>
            <p className="text-sm text-muted-foreground">
              Manage and view all your published research repositories
            </p>
          </div>
          <Button
            onClick={() => router.push("/publisher/publish")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus size={20} />
            Publish
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Panel */}
          <aside className="hidden lg:block w-full lg:w-64 shrink-0">
            <FilterPanel
              onFilterChange={setFilters}
              onSearch={setSearchQuery}
              isOpen={true}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and Filter Toggle */}
            <div className="flex gap-4 mb-8 flex-col sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search repositories..."
                  value={filters.keywords}
                  onChange={(e) => {
                    const value = e.target.value
                    setFilters((prev) => ({ ...prev, keywords: value }))
                    setSearchQuery(value)
                  }}
                  className="pl-10 bg-background border-border"
                  aria-label="Search repositories"
                />
              </div>
              <Button
                variant="outline"
                className="lg:hidden gap-2 bg-transparent"
                onClick={() => setIsFilterOpen(true)}
              >
                <Menu size={20} />
                Filters
              </Button>
            </div>

            {/* Mobile Filter Panel */}
            {isFilterOpen && (
              <FilterPanel
                onFilterChange={setFilters}
                onSearch={setSearchQuery}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            )}

            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredRepositories.length}</span> of{" "}
                <span className="font-semibold text-foreground">{repositories.length}</span> repositories
              </p>
            </div>

            {/* Repository Grid or Empty State */}
            {filteredRepositories.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {filteredRepositories.map((repo) => {
                  const publisherObj = typeof repo.publisher === 'object'
                    ? repo.publisher
                    : { name: 'Unknown', avatar: 'U' }
                  return (
                    <RepositoryCard
                      key={repo.id}
                      id={String(repo.id)}
                      title={repo.title}
                      abstract={repo.abstract}
                      publisher={publisherObj}
                      category={repo.category}
                      tags={repo.keywords}
                      publishedDate={repo.publishedDate}
                      publishedStatus={repo.publishedStatus as "pending" | "published" | "rejected" | "unpublished"}
                      pdfUrl={repo.pdfUrl}
                      views={repo.views}
                      likes={repo.likes}
                      isLiked={repo.isLiked}
                      rating={repo.rating}
                      ratingCount={repo.ratingCount}
                      user={user}
                      detailPath="/publisher/my-repository"
                      onViewClick={() => {
                        setSelectedRepository(repo)
                        setIsModalOpen(true)
                      }}
                    />
                  )
                })}
              </div>
            ) : repositories.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <FileText size={40} className="text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No repositories yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven't created any repositories yet. Start sharing your research by publishing your first repository.
                </p>
                <Button
                  onClick={() => router.push("/publisher/publish")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Plus size={20} />
                  Publish Your First Repository
                </Button>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground mb-2">No repositories found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repository View Modal */}
      {selectedRepository && (
        <RepositoryViewModal
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open)
            if (!open) {
              setSelectedRepository(null)
            }
          }}
          repository={{
            id: String(selectedRepository.id),
            title: selectedRepository.title,
            abstract: selectedRepository.abstract,
            publisher: typeof selectedRepository.publisher === 'object'
              ? selectedRepository.publisher
              : { name: 'Unknown', avatar: 'U' },
            category: selectedRepository.category,
            tags: selectedRepository.keywords,
            publishedDate: selectedRepository.publishedDate,
            publishedStatus: selectedRepository.publishedStatus,
            pdfUrl: selectedRepository.pdfUrl,
            pdfData: selectedRepository.pdfData,
          }}
          user={user}
        />
      )}
    </main>
  )
}
