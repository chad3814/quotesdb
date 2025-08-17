import Link from "next/link"
import { prisma } from "@/lib/db"
import AuthButton from "@/components/auth/AuthButton"

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                QuotesDB
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/movies" 
                className="text-gray-600 hover:text-gray-900"
              >
                Movies
              </Link>
              <Link 
                href="/quotes/new" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Quote
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Quotes</h1>
            <Link 
              href="/quotes/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Quote
            </Link>
          </div>
          
          {quotes.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M21 12h.01M8 20h.01M21 20h.01M8 28h.01M21 28h.01M36 12h.01M36 20h.01M36 28h.01" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a memorable quote.
                </p>
                <div className="mt-6">
                  <Link
                    href="/quotes/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add the first quote
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => {
                const media = quote.movie || (quote.episode && {
                  title: `${quote.episode.season.tvShow.title} - S${quote.episode.season.number}E${quote.episode.number}`,
                  id: quote.episode.id
                })
                
                return (
                  <div key={quote.id} className="bg-white shadow rounded-lg p-6">
                    {/* Media Title */}
                    {media && (
                      <div className="mb-3">
                        {quote.movie ? (
                          <Link 
                            href={`/movies/${quote.movie.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {media.title}
                            {quote.movie.releaseYear && ` (${quote.movie.releaseYear})`}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {media.title}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Quote Lines */}
                    <div className="space-y-2">
                      {quote.lines.map((line) => (
                        <div key={line.id} className="text-gray-700">
                          {line.character && (
                            <span className="font-medium text-gray-900">
                              {line.character.name}:{" "}
                            </span>
                          )}
                          <span className="italic">&ldquo;{line.content}&rdquo;</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Quote Metadata */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <div>
                        {quote.creator && (
                          <span>Added by {quote.creator.displayName}</span>
                        )}
                      </div>
                      <div>
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}