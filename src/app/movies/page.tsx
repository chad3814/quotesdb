import Link from "next/link"
import { prisma } from "@/lib/db"
import PageLayout from "@/components/layout/PageLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"

export const dynamic = "force-dynamic"

export default async function MoviesPage() {
  const movies = await prisma.movie.findMany({
    include: {
      _count: {
        select: {
          quotes: true,
          characterPortrayals: true
        }
      }
    },
    orderBy: [
      { releaseYear: "desc" },
      { title: "asc" }
    ]
  })

  return (
    <PageLayout>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 mb-2">Movies</h1>
            <p className="text-body-secondary">Browse your movie collection and discover new quotes</p>
          </div>
          
          <Link href="/movies/add">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Import from TMDB
            </Button>
          </Link>
        </div>
      </div>

          {movies.length === 0 ? (
            <EmptyState
              icon={<span className="text-6xl">🎬</span>}
              title="No movies yet"
              description="Get started by importing movies from The Movie Database (TMDB) to begin building your collection."
              action={
                <Link href="/movies/add">
                  <Button size="lg">
                    <span className="mr-2">🎆</span>
                    Import Movies
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {movies.map((movie, index) => (
                <Card 
                  key={movie.id} 
                  hover
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link href={`/movies/${movie.id}`} className="block">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="heading-5 text-primary-700 mb-1 truncate">
                            {movie.title}
                          </h3>
                          {movie.releaseYear && (
                            <p className="text-caption">
                              🗺 Released {movie.releaseYear}
                            </p>
                          )}
                        </div>
                        <div className="ml-3 text-2xl">
                          🎬
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-text-secondary">
                          <span className="mr-2">💬</span>
                          {movie._count.quotes} {movie._count.quotes === 1 ? "quote" : "quotes"}
                        </div>
                        <div className="flex items-center text-sm text-text-secondary">
                          <span className="mr-2">🎭</span>
                          {movie._count.characterPortrayals} cast members
                        </div>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap">
                        {movie.tmdbId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-800">
                            TMDB
                          </span>
                        )}
                        {movie.imdbId && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            IMDb
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
    </PageLayout>
  )
}