import { redirect } from "next/navigation"
import { getServerSession, getUserById } from "@/lib/auth-utils"
import Link from "next/link"
import AuthButton from "@/components/auth/AuthButton"
import DisplayNameSection from "@/components/settings/DisplayNameSection"
import AccountLinkingSection from "@/components/settings/AccountLinkingSection"

export default async function SettingsPage() {
  const session = await getServerSession()

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/settings")
  }

  const user = await getUserById(session.user.id)

  if (!user) {
    redirect("/auth/signin?callbackUrl=/settings")
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Add Quote
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-gray-400 hover:text-gray-500">
                Home
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-4 text-sm font-medium text-gray-900">Settings</span>
            </li>
          </ol>
        </nav>

        {/* Page header */}
        <div className="pb-5 border-b border-gray-200 mb-8">
          <h1 className="text-3xl font-bold leading-6 text-gray-900">Account Settings</h1>
          <p className="mt-2 max-w-4xl text-sm text-gray-500">
            Manage your account information and preferences.
          </p>
        </div>

        {/* Settings sections */}
        <div className="space-y-8">
          {/* Account Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member since</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Display Name Management */}
          <DisplayNameSection user={user} />

          {/* Account Linking */}
          <AccountLinkingSection user={user} />
        </div>
      </div>
    </div>
  )
}