import { redirect } from "next/navigation"
import { getServerSession, getUserById } from "@/lib/auth-utils"
import Link from "next/link"
import PageLayout from "@/components/layout/PageLayout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import DisplayNameSection from "@/components/settings/DisplayNameSection"
import AccountLinkingSection from "@/components/settings/AccountLinkingSection"
import { formatDate } from "@/lib/utils"

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
    <PageLayout maxWidth="content">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/" className="text-text-muted hover:text-text-secondary transition-colors">
                <span className="flex items-center gap-2">
                  <span>🏠</span>
                  Home
                </span>
              </Link>
            </li>
            <li className="flex items-center">
              <svg className="flex-shrink-0 h-5 w-5 text-border-dark mx-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <span>⚙️</span>
                Settings
              </span>
            </li>
          </ol>
        </nav>

        {/* Page header */}
        <div className="text-center pb-8 border-b border-border-light mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl">👤</span>
          </div>
          <h1 className="heading-2 mb-3">Account Settings</h1>
          <p className="text-body-secondary max-w-2xl mx-auto">
            Manage your account information and preferences to personalize your QuotesDB experience.
          </p>
        </div>

        {/* Settings sections */}
        <div className="space-y-8">
          {/* Account Information */}
          <Card className="animate-slide-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="form-label flex items-center gap-2">
                    <span>📧</span>
                    Email
                  </label>
                  <div className="text-text-primary font-medium">{user.email}</div>
                </div>
                <div>
                  <label className="form-label flex items-center gap-2">
                    <span>📅</span>
                    Member since
                  </label>
                  <div className="text-text-primary font-medium">
                    {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Name Management */}
          <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <DisplayNameSection user={user} />
          </div>

          {/* Account Linking */}
          <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <AccountLinkingSection user={user} />
          </div>
        </div>
    </PageLayout>
  )
}