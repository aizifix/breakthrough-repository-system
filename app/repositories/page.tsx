"use client"

import { useState, useMemo, useEffect } from "react"
import Navbar from "@/components/navbar"
import RepositoryCard from "@/components/repository-card"
import RepositoryCardSkeleton from "@/components/repository-card-skeleton"
import RepositoryViewModal from "@/components/repository-view-modal"
import FilterPanel, { type FilterState } from "@/components/filter-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Search } from "lucide-react"
import { getAllRepositories } from "@/app/config/api"

interface Repository {
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
}

export default function RepositoriesPage() {
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    researchTypes: [],
    yearFrom: "",
    yearTo: "",
    categories: [],
    keywords: "",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(12) // Initial display limit
  const ITEMS_PER_PAGE = 12 // Items to show per "see more" click

  // Load user from localStorage on mount and listen for changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadUser = () => {
        const stored = localStorage.getItem("user")
        if (stored) {
          setUser(JSON.parse(stored))
        } else {
          setUser(null)
        }
      }

      // Load user on mount
      loadUser()

      // Listen for storage changes (e.g., when logout happens)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "user") {
          loadUser()
        }
      }

      // Listen for custom logout event
      const handleLogout = () => {
        loadUser()
      }

      window.addEventListener("storage", handleStorageChange)
      window.addEventListener("userLogout", handleLogout)

      return () => {
        window.removeEventListener("storage", handleStorageChange)
        window.removeEventListener("userLogout", handleLogout)
      }
    }
  }, [])

  // Fetch published repositories from API
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setIsLoading(true)
        // Get userId if user is logged in
        const userId = user ? ((user as any).userId || (user as any).user_id) : undefined
        const response = await getAllRepositories({
          categories: filters.categories,
          yearFrom: filters.yearFrom,
          yearTo: filters.yearTo,
        }, userId)

        if (response.status === "success" && response.data) {
          // Transform API response to match frontend format
          // Filter to ONLY show published repositories (safety check)
          const transformedRepos: Repository[] = response.data
            .filter((repo: any) => repo.publishedStatus?.toLowerCase() === 'published')
            .map((repo: any) => {
              // Generate avatar from publisher name
              const avatar = repo.publisher_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              return {
                id: String(repo.id),
                title: repo.title,
                abstract: repo.abstract,
                publisher: {
                  name: repo.publisher_name,
                  avatar: avatar,
                  isVerified: repo.publisher_is_verified ?? false,
                },
                category: Array.isArray(repo.category) ? repo.category : [],
                tags: Array.isArray(repo.tags) ? repo.tags : [],
                publishedDate: repo.publishedDate || null,
                publishedStatus: repo.publishedStatus as "published",
                pdfUrl: repo.pdfUrl || undefined,
                views: repo.views ?? 0,
                likes: repo.likes ?? 0,
                isLiked: repo.isLiked ?? false,
                rating: repo.rating ?? 0,
                ratingCount: repo.rating_count ?? 0,
              }
            })
          setRepositories(transformedRepos)
        } else {
          setRepositories([])
        }
      } catch (error) {
        console.error("Error fetching repositories:", error)
        setRepositories([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepositories()
  }, [filters.categories, filters.yearFrom, filters.yearTo, user]) // Re-fetch when filters or user change

  // Transform user for Navbar component
  const navbarUser = user
    ? {
        name: user.name,
        role: user.role,
        avatar: user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }
    : undefined

  // Filter repositories by keywords (client-side filtering for keywords since API handles categories/years)
  const filteredRepositories = useMemo(() => {
    if (!filters.keywords) {
      return repositories
    }

    const query = filters.keywords.toLowerCase()
    return repositories.filter((repo) => {
      const matches =
        repo.title.toLowerCase().includes(query) ||
        repo.abstract.toLowerCase().includes(query) ||
        repo.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        repo.category.some((cat) => cat.toLowerCase().includes(query))
      return matches
    })
  }, [repositories, filters.keywords])

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(12)
  }, [filters.categories, filters.yearFrom, filters.yearTo, filters.keywords])

  // Get displayed repositories (limited)
  const displayedRepositories = useMemo(() => {
    return filteredRepositories.slice(0, displayLimit)
  }, [filteredRepositories, displayLimit])

  const handleSeeMore = () => {
    setDisplayLimit((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredRepositories.length))
  }

  const handleSeeLess = () => {
    setDisplayLimit(12)
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar user={navbarUser} />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance">
              Browse Research Repositories
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              Explore and discover peer-reviewed research publications across multiple disciplines. Find cutting-edge publications from
              researchers worldwide.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Panel */}
          <aside className="hidden lg:block w-full lg:w-64 shrink-0">
            <FilterPanel onFilterChange={setFilters} onSearch={setSearchQuery} isOpen={true} />
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
                {isLoading ? (
                  "Loading repositories..."
                ) : (
                  <>
                    Showing <span className="font-semibold text-foreground">{filteredRepositories.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{repositories.length}</span> repositories
                  </>
                )}
              </p>
            </div>

            {/* Repository Grid */}
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <RepositoryCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredRepositories.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {displayedRepositories.map((repo) => (
                    <RepositoryCard
                      key={repo.id}
                      {...repo}
                      user={user}
                      detailPath="/publisher/my-repository"
                      onViewClick={() => {
                        // Allow viewing modal even when not logged in
                        setSelectedRepository(repo)
                        setIsModalOpen(true)
                      }}
                    />
                  ))}
                </div>

                {/* See More / See Less Buttons */}
                {filteredRepositories.length > 12 && (
                  <div className="flex justify-center mt-8">
                    {displayLimit < filteredRepositories.length ? (
                      <Button
                        onClick={handleSeeMore}
                        variant="outline"
                        className="gap-2"
                      >
                        See More
                        <span className="text-xs text-muted-foreground ml-2">
                          ({filteredRepositories.length - displayLimit} more)
                        </span>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSeeLess}
                        variant="outline"
                        className="gap-2"
                      >
                        See Less
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No repositories found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repository View Modal */}
      <RepositoryViewModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setSelectedRepository(null)
          }
        }}
        repository={selectedRepository}
        user={user}
      />
    </main>
  )
}
