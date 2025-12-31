"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import RepositoryCard from "@/components/repository-card"
import RepositoryCardSkeleton from "@/components/repository-card-skeleton"
import RepositoryViewModal from "@/components/repository-view-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FileText, User, Search, CheckCircle2, Plus } from "lucide-react"
import { getAllRepositories, getAnnouncements } from "@/app/config/api"
import Link from "next/link"

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

interface Announcement {
  id: string
  title: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

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

interface Announcement {
  id: string
  title: string
  content: string
  published: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true)
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(6)
  const ITEMS_PER_PAGE = 6
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el)
    })

    setHeroVisible(true)

    return () => {
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        observer.unobserve(el)
      })
    }
  }, [])

  // Load user from localStorage on mount and listen for changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadUser = () => {
        const stored = localStorage.getItem("user")
        if (stored) {
          const userData = JSON.parse(stored)
          setUser(userData)
          // If user is logged in, redirect to their dashboard immediately
          const userRole = userData.role || "publisher"
          if (userRole === "admin") {
            router.replace("/admin/dashboard")
          } else {
            router.replace("/publisher")
          }
          return // Don't continue rendering the page
        } else {
          setUser(null)
        }
      }

      loadUser()

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "user") {
          const stored = localStorage.getItem("user")
          if (stored) {
            // User logged in, redirect
            const userData = JSON.parse(stored)
            const userRole = userData.role || "publisher"
            if (userRole === "admin") {
              router.replace("/admin/dashboard")
            } else {
              router.replace("/publisher")
            }
          } else {
            // User logged out, stay on home
            setUser(null)
          }
        }
      }

      const handleLogout = () => {
        const stored = localStorage.getItem("user")
        if (!stored) {
          // User logged out, stay on home
          setUser(null)
        } else {
          // User still logged in, redirect
          loadUser()
        }
      }

      window.addEventListener("storage", handleStorageChange)
      window.addEventListener("userLogout", handleLogout)

      return () => {
        window.removeEventListener("storage", handleStorageChange)
        window.removeEventListener("userLogout", handleLogout)
      }
    }
  }, [router])

  // Debug: Log announcements state changes
  useEffect(() => {
    console.log("Announcements state updated:", announcements.length, "announcements")
    if (announcements.length > 0) {
      console.log("First announcement:", announcements[0])
    }
  }, [announcements])

  // Load announcements from API
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setIsLoadingAnnouncements(true)
        console.log("Fetching announcements...")
        const response = await getAnnouncements(true) // Only published
        console.log("Announcements response:", response)
        
        if (response.status === "success" && response.data) {
          // Sort by date, newest first, and take latest 3
          const sorted = response.data
            .sort((a: any, b: any) =>
              new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
            )
            .slice(0, 3)
            .map((ann: any) => ({
              id: String(ann.id),
              title: ann.title,
              content: ann.content,
              published: ann.published,
              createdAt: ann.created_at || ann.createdAt,
              updatedAt: ann.updated_at || ann.updatedAt,
              createdBy: ann.created_by_name || ann.createdBy || "Admin",
            }))
          setAnnouncements(sorted)
          console.log("Announcements loaded:", sorted.length)
        } else {
          console.log("No announcements data or error:", response.message)
          setAnnouncements([])
        }
      } catch (error) {
        console.error("Error fetching announcements:", error)
        setAnnouncements([])
      } finally {
        setIsLoadingAnnouncements(false)
      }
    }
    fetchAnnouncements()
  }, [])

  // Fetch featured repositories from API
  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setIsLoading(true)
        // Get userId if user is logged in
        const userId = user ? ((user as any).userId || (user as any).user_id) : undefined
        const response = await getAllRepositories({
          categories: [],
          yearFrom: "",
          yearTo: "",
        }, userId)

        if (response.status === "success" && response.data) {
          // Transform API response to match frontend format
          // Filter to ONLY show published repositories (safety check)
          const transformedRepos: Repository[] = response.data
            .filter((repo: any) => repo.publishedStatus?.toLowerCase() === 'published')
            .map((repo: any) => {
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
          // Sort by published date, newest first, and take latest 6
          const sorted = transformedRepos
            .sort((a, b) => {
              const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
              const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
              return dateB - dateA
            })
            .slice(0, 6)
          setRepositories(sorted)
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
  }, [user])

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar user={navbarUser} />

      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-b border-border overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className={`text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight transition-all duration-1000 ${heroVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              Breakthrough Research
              <span className="block text-primary mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">Repository</span>
            </h1>
            <p className={`text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 ${heroVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
              Discover, share, and collaborate on cutting-edge research across multiple disciplines.
              Join a global community of researchers and scholars.
            </p>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 ${heroVisible ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'}`}>
              <Link href="/repositories">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                  <Search className="mr-2 h-5 w-5" />
                  Explore Repositories
                </Button>
              </Link>
              {!user && (
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 scroll-reveal">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Announcements</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with important news and platform highlights
            </p>
          </div>

          {isLoadingAnnouncements ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-5 bg-muted rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-muted rounded w-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                      <div className="h-4 bg-muted rounded w-4/6 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map((announcement, index) => (
                <Card key={announcement.id} className="border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatDate(announcement.createdAt)}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{announcement.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-4">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No announcements at this time</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="scroll-reveal">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Repositories</h2>
              <p className="text-xl text-muted-foreground">Dive into the latest research publications from our community</p>
            </div>
            <Link href="/repositories" className="hidden md:flex">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <RepositoryCardSkeleton key={i} />
              ))}
            </div>
          ) : repositories.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                {repositories.slice(0, displayLimit).map((repo) => (
                  <RepositoryCard
                    key={repo.id}
                    {...repo}
                    user={user}
                    detailPath="/publisher/my-repository"
                    onViewClick={() => {
                      setSelectedRepository(repo)
                      setIsModalOpen(true)
                    }}
                  />
                ))}
              </div>

              {repositories.length > 6 && (
                <div className="flex justify-center gap-4 scroll-reveal">
                  {displayLimit < repositories.length ? (
                    <Button
                      onClick={() => setDisplayLimit((prev) => Math.min(prev + ITEMS_PER_PAGE, repositories.length))}
                      variant="outline"
                      className="gap-2"
                    >
                      See More
                      <span className="text-xs text-muted-foreground ml-2">
                        ({repositories.length - displayLimit} more)
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setDisplayLimit(6)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      variant="outline"
                      className="gap-2"
                    >
                      See Less
                    </Button>
                  )}
                  <Link href="/repositories">
                    <Button size="lg" variant="outline" className="md:hidden">
                      View All Repositories
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 scroll-reveal">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground mb-2">No repositories available yet</p>
              <p className="text-sm text-muted-foreground">Check back soon for new publications</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">About Breakthrough</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A comprehensive platform designed to revolutionize how research is shared, discovered, and accessed
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Rich Repository", description: "Access thousands of peer-reviewed research publications across diverse disciplines" },
              { icon: User, title: "Global Community", description: "Connect with researchers, scholars, and academics from around the world" },
              { icon: Search, title: "Powerful Discovery", description: "Advanced filtering and search capabilities to surface the work you need faster" },
              { icon: CheckCircle2, title: "Quality First", description: "Every submission is reviewed to maintain academic integrity and relevance" },
              { icon: Plus, title: "Publish Easily", description: "A streamlined publishing workflow built for busy researchers and advisors" },
              { icon: FileText, title: "Open & Accessible", description: "Share knowledge broadly with open access downloads and sharable repository links" },
            ].map((item, index) => (
              <Card
                key={index}
                className="border-border hover:shadow-lg transition-all duration-300 scroll-reveal"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                  <CardDescription className="text-base">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-accent/10 border-t border-border relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
          <div className="relative max-w-4xl mx-auto text-center scroll-reveal">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of researchers sharing and discovering groundbreaking research
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6">
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/repositories">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Browse Repositories
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
