import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-utils"
import AddMoviesForm from "./AddMoviesForm"
import Link from "next/link"
import AuthButton from "@/components/auth/AuthButton"

export default async function AddMoviesPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/movies/add")
  }

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
                href="/quotes/new" 
                className="text-gray-600 hover:text-gray-900"
              >
                Add Quote
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Add Movies from TMDB</h1>
            <p className="mt-2 text-gray-600">
              Import movies from The Movie Database (TMDB) by ID or from a list.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <AddMoviesForm />
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p className="font-semibold mb-2">How to find TMDB IDs:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Movie ID:</strong> Go to a movie on{" "}
                <a 
                  href="https://www.themoviedb.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  themoviedb.org
                </a>
                . The ID is in the URL (e.g., /movie/<strong>550</strong> for Fight Club)
              </li>
              <li>
                <strong>List ID:</strong> Browse{" "}
                <a 
                  href="https://www.themoviedb.org/lists" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  public lists
                </a>
                . The ID is in the URL (e.g., /list/<strong>7060919</strong>)
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}