import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import AuthButton from "@/components/auth/AuthButton"
import BackButton from "@/components/BackButton"

export const dynamic = "force-dynamic"

interface QuotePageProps {
  params: Promise<{ id: string }>
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { id } = await params

  const quote = await prisma.quote.findUnique({
    where: { id },
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
  })

  if (!quote) {
    notFound()
  }

  const media = quote.movie || (quote.episode && {
    title: `${quote.episode.season.tvShow.title} - S${quote.episode.season.number}E${quote.episode.number}`,
    id: quote.episode.id
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
                href="/quotes" 
                className="text-gray-600 hover:text-gray-900"
              >
                Quotes
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
            <Link href="/quotes" className="hover:text-gray-700">
              Quotes
            </Link>
            <svg className="mx-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {media && quote.movie && (
              <>
                <Link href={`/movies/${quote.movie.id}`} className="hover:text-gray-700">
                  {media.title}
                </Link>
                <svg className="mx-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </>
            )}
            <span className="text-gray-900">Quote</span>
          </nav>

          <div className="bg-white shadow rounded-lg p-6">
            {/* Media Title */}
            {media && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-gray-600 mb-1">From</h2>
                {quote.movie ? (
                  <Link 
                    href={`/movies/${quote.movie.id}`}
                    className="text-xl font-semibold text-blue-600 hover:text-blue-800"
                  >
                    {media.title}
                    {quote.movie.releaseYear && ` (${quote.movie.releaseYear})`}
                  </Link>
                ) : (
                  <span className="text-xl font-semibold text-gray-900">
                    {media.title}
                  </span>
                )}
              </div>
            )}
            
            {/* Quote Lines */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-600 mb-3">Quote</h2>
              <div className="space-y-3 bg-gray-50 rounded-lg p-6">
                {quote.lines.map((line) => (
                  <div key={line.id} className="text-lg">
                    {line.lineType === "STAGE_DIRECTION" ? (
                      <span className="italic text-gray-600">[{line.content}]</span>
                    ) : line.lineType === "NARRATION" ? (
                      <span className="italic text-gray-700">{line.content}</span>
                    ) : (
                      <>
                        {line.character && (
                          <span className="font-semibold text-gray-900">
                            {line.character.name}:{" "}
                          </span>
                        )}
                        <span className="text-gray-800">&ldquo;{line.content}&rdquo;</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quote Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
              <div>
                {quote.creator && (
                  <span>Added by {quote.creator.displayName}</span>
                )}
              </div>
              <div>
                {new Date(quote.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-between">
            <BackButton />
            {quote.movie && (
              <Link
                href={`/quotes/new?movieId=${quote.movie.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Another Quote
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}