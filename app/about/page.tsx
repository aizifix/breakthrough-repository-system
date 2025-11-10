import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/navbar"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-foreground mb-8">About Breakthrough</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Our Mission</h2>
            <p>
              Breakthrough is dedicated to democratizing access to research publications. We provide a centralized
              platform where researchers, academics, and institutions can share, discover, and collaborate on
              groundbreaking research across all disciplines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">What We Offer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Easy repository publishing and management</li>
              <li>Advanced search and filtering capabilities</li>
              <li>Secure document downloads with signed URLs</li>
              <li>Multi-disciplinary research organization</li>
              <li>Researcher profiles and collaboration tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">For Publishers</h2>
            <p>
              Publishers can create accounts to share their research with the global academic community. Our platform
              provides analytics, version control, and tools to manage multiple publications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-3">Get Started</h2>
            <p>
              Ready to share your research or discover new publications? Create an account and join thousands of
              researchers on Breakthrough.
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="/auth/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Browse Research</Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
