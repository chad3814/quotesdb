import Link from "next/link"
import AuthButton from "@/components/auth/AuthButton"

export default function QuotesPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Browse Quotes</h1>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                No quotes yet
              </h2>
              <p className="text-gray-600 mb-6">
                Be the first to add a memorable quote from your favorite movie or TV show!
              </p>
              <Link 
                href="/quotes/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
              >
                Add Your First Quote
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}