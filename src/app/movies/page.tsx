import Link from "next/link"
import { prisma } from "@/lib/db"
import AuthButton from "@/components/auth/AuthButton"

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
                href="/quotes" 
                className="text-gray-600 hover:text-gray-900"
              >
                Browse Quotes
              </Link>
              <Link 
                href="/movies/add" 
                className="text-gray-600 hover:text-gray-900"
              >
                Import Movies
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Movies</h1>
            <Link
              href="/movies/add"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Import from TMDB
            </Link>
          </div>

          {movies.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v36c0 2.21 1.79 4 4 4h26c2.21 0 4-1.79 4-4V16.83c0-1.06-.42-2.08-1.17-2.83l-8.83-8.83A4.008 4.008 0 0028.17 4H11c-2.21 0-4 1.79-4 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M28 4v8c0 2.21 1.79 4 4 4h8" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No movies yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by importing movies from TMDB.
                </p>
                <div className="mt-6">
                  <Link
                    href="/movies/add"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Import Movies
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {movies.map((movie) => (
                  <li key={movie.id}>
                    <Link
                      href={`/movies/${movie.id}`}
                      className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-lg font-medium text-blue-600 truncate">
                              {movie.title}
                            </p>
                            {movie.releaseYear && (
                              <span className="ml-2 text-sm text-gray-500">
                                ({movie.releaseYear})
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                              {movie._count.quotes} {movie._count.quotes === 1 ? "quote" : "quotes"}
                            </span>
                            <span className="ml-4 flex items-center">
                              <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {movie._count.characterPortrayals} cast members
                            </span>
                            {movie.tmdbId && (
                              <span className="ml-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                TMDB
                              </span>
                            )}
                            {movie.imdbId && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                IMDb
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}