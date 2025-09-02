import Link from "next/link"
import PageLayout from "@/components/layout/PageLayout"
import { Button } from "@/components/ui/Button"

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="text-center py-20">
        <div className="animate-scale-in">
          <div className="flex items-center justify-center mb-8">
            <div className="text-8xl">📚</div>
          </div>
          
          <h1 className="heading-1 mb-6 text-balance">
            QuotesDB
          </h1>
          
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Discover and share memorable quotes from your favorite movies and TV shows. 
            Build your personal collection of cinema&apos;s most iconic moments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-in">
            <Link href="/quotes">
              <Button size="lg" className="w-full sm:w-auto">
                <span className="mr-2">💬</span>
                Browse Quotes
              </Button>
            </Link>
            
            <Link href="/movies/add">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                <span className="mr-2">🎬</span>
                Import Movies
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 border-t border-border-light">
        <div className="text-center mb-16">
          <h2 className="heading-2 mb-4">Start Your Collection</h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Sign in to create your personal collection of memorable quotes and discover 
            what makes each movie and TV show truly unforgettable.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center animate-in">
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h3 className="heading-5 mb-2">Curated Collection</h3>
            <p className="text-text-secondary">
              Build your personal library of the most impactful quotes from cinema and television.
            </p>
          </div>
          
          <div className="text-center animate-in" style={{animationDelay: '0.1s'}}>
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🌟</span>
            </div>
            <h3 className="heading-5 mb-2">Easy Discovery</h3>
            <p className="text-text-secondary">
              Search and explore quotes from thousands of movies and TV shows with detailed metadata.
            </p>
          </div>
          
          <div className="text-center animate-in" style={{animationDelay: '0.2s'}}>
            <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💡</span>
            </div>
            <h3 className="heading-5 mb-2">Share & Connect</h3>
            <p className="text-text-secondary">
              Connect with other film enthusiasts and share the quotes that resonate with you.
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}