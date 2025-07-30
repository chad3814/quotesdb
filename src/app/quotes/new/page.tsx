import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-utils"
import NewQuoteForm from "./NewQuoteForm"
import Link from "next/link"
import AuthButton from "@/components/auth/AuthButton"

export default async function NewQuotePage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/quotes/new")
  }

  if (!session.user.displayName) {
    redirect("/auth/signin?callbackUrl=/quotes/new")
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
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Add New Quote</h1>
            <p className="mt-2 text-gray-600">
              Share a memorable quote from your favorite movie or TV show.
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <NewQuoteForm userId={session.user.id} />
          </div>
        </div>
      </main>
    </div>
  )
}