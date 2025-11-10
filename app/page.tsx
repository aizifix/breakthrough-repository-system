"use client"

import { useState, useMemo, useEffect } from "react"
import Navbar from "@/components/navbar"
import RepositoryCard from "@/components/repository-card"
import RepositoryViewModal from "@/components/repository-view-modal"
import FilterPanel, { type FilterState } from "@/components/filter-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
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

export default function HomePage() {
  const router = useRouter()
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
        const response = await getAllRepositories({
          categories: filters.categories,
          yearFrom: filters.yearFrom,
          yearTo: filters.yearTo,
        })

        if (response.status === "success" && response.data) {
          // Transform API response to match frontend format
          const transformedRepos: Repository[] = response.data.map((repo: any) => {
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
              },
              category: Array.isArray(repo.category) ? repo.category : [],
              tags: Array.isArray(repo.tags) ? repo.tags : [],
              publishedDate: repo.publishedDate || null,
              publishedStatus: repo.publishedStatus as "published",
              pdfUrl: repo.pdfUrl || undefined,
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
  }, [filters.categories, filters.yearFrom, filters.yearTo]) // Re-fetch when filters change

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

  return (
    <main className="min-h-screen bg-background">
      <Navbar user={navbarUser} />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 text-balance">
                Discover Research Publications
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
                Browse and download peer-reviewed research across multiple disciplines. Find cutting-edge publications from
                researchers worldwide.
              </p>
            </div>
            {user && (
              <Button
                onClick={() => router.push("/publisher/publish")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 shrink-0"
              >
                <Plus size={20} />
                Publish
              </Button>
            )}
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
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading repositories...</p>
              </div>
            ) : filteredRepositories.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {filteredRepositories.map((repo) => (
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
