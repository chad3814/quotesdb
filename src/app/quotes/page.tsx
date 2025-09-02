import Link from "next/link"
import { prisma } from "@/lib/db"
import PageLayout from "@/components/layout/PageLayout"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { formatRelativeDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    include: {
      lines: {
        include: {
          character: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
      movie: true,
      episode: {
        include: {
          season: {
            include: {
              tvShow: true,
            },
          },
        },
      },
      creator: {
        select: {
          displayName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <PageLayout>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 mb-2">All Quotes</h1>
            <p className="text-body-secondary">Discover memorable quotes from movies and TV shows</p>
          </div>
          
          <Link href="/quotes/new">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Quote
            </Button>
          </Link>
        </div>
      </div>
          
          {quotes.length === 0 ? (
            <EmptyState
              icon={<span className="text-6xl">💬</span>}
              title="No quotes yet"
              description="Get started by adding a memorable quote from your favorite movie or TV show."
              action={
                <Link href="/quotes/new">
                  <Button size="lg">
                    <span className="mr-2">✨</span>
                    Add the first quote
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-6">
              {quotes.map((quote, index) => {
                const media = quote.movie || (quote.episode && {
                  title: `${quote.episode.season.tvShow.title} - S${quote.episode.season.number}E${quote.episode.number}`,
                  id: quote.episode.id
                })
                
                return (
                  <Card 
                    key={quote.id} 
                    hover
                    className={`animate-slide-in`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      {media && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{quote.movie ? '🎬' : '📺'}</span>
                          {quote.movie ? (
                            <Link 
                              href={`/movies/${quote.movie.id}`}
                              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              {media.title}
                              {quote.movie.releaseYear && ` (${quote.movie.releaseYear})`}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-text-secondary">
                              {media.title}
                            </span>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        {quote.lines.map((line) => (
                          <div key={line.id} className="text-text-primary leading-relaxed">
                            {line.character && (
                              <span className="font-semibold text-text-primary mr-1">
                                {line.character.name}:
                              </span>
                            )}
                            <span className="italic text-lg">&ldquo;{line.content}&rdquo;</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardFooter>
                      <div className="flex items-center justify-between text-caption">
                        <div>
                          {quote.creator && (
                            <span className="flex items-center gap-1">
                              <span>👤</span>
                              Added by {quote.creator.displayName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🗓️</span>
                          {formatRelativeDate(quote.createdAt)}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
    </PageLayout>
  )
}