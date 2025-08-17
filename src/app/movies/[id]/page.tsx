import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import AuthButton from "@/components/auth/AuthButton"

interface MoviePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { id } = await params
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      characterPortrayals: {
        include: {
          actor: true,
          character: true
        },
        orderBy: {
          character: {
            name: "asc"
          }
        }
      },
      quotes: {
        include: {
          lines: {
            include: {
              character: true
            },
            orderBy: {
              orderIndex: "asc"
            }
          },
          creator: {
            select: {
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  })

  if (!movie) {
    notFound()
  }

  const tmdbUrl = movie.tmdbId 
    ? `https://www.themoviedb.org/movie/${movie.tmdbId}`
    : null

  const imdbQuotesUrl = movie.imdbId
    ? `https://www.imdb.com/title/${movie.imdbId}/quotes`
    : null

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
                Browse Movies
              </Link>
              <Link 
                href="/quotes" 
                className="text-gray-600 hover:text-gray-900"
              >
                Browse Quotes
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
          {/* Movie Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {movie.title}
                {movie.releaseYear && (
                  <span className="text-2xl text-gray-600 ml-2">
                    ({movie.releaseYear})
                  </span>
                )}
              </h1>
            </div>

            {movie.overview && (
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {/* External Links */}
            <div className="flex flex-wrap gap-3">
              {tmdbUrl && (
                <Link
                  href={tmdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                  </svg>
                  View on TMDB
                </Link>
              )}
              
              {imdbQuotesUrl && (
                <Link
                  href={imdbQuotesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-yellow-400 rounded-md shadow-sm text-sm font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  IMDb Quotes
                </Link>
              )}

              <Link
                href={`/quotes/new?movieId=${movie.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Quote
              </Link>
            </div>

            {/* Movie Metadata */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {movie.tmdbId && (
                  <div>
                    <span className="font-medium">TMDB ID:</span> {movie.tmdbId}
                  </div>
                )}
                {movie.imdbId && (
                  <div>
                    <span className="font-medium">IMDb ID:</span> {movie.imdbId}
                  </div>
                )}
                <div>
                  <span className="font-medium">Quotes:</span> {movie.quotes.length}
                </div>
                <div>
                  <span className="font-medium">Cast Members:</span> {movie.characterPortrayals.length}
                </div>
              </div>
            </div>
          </div>

          {/* Cast Section */}
          {movie.characterPortrayals.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cast</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movie.characterPortrayals.map((portrayal) => (
                  <div 
                    key={portrayal.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {portrayal.actor.name}
                      </p>
                      {portrayal.character && (
                        <p className="text-sm text-gray-600">
                          as {portrayal.character.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quotes Section */}
          {movie.quotes.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Quotes from this Movie
              </h2>
              <div className="space-y-4">
                {movie.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="space-y-2">
                      {quote.lines.map((line) => (
                        <div key={line.id} className="text-gray-700">
                          {line.character && (
                            <span className="font-medium text-gray-900">
                              {line.character.name}:{" "}
                            </span>
                          )}
                          <span>{line.content}</span>
                        </div>
                      ))}
                    </div>
                    {quote.creator && (
                      <div className="mt-2 text-xs text-gray-500">
                        Added by {quote.creator.displayName}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Quotes Message */}
          {movie.quotes.length === 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quotes yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Be the first to add a memorable quote from this movie.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/quotes/new?movieId=${movie.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add the first quote
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}