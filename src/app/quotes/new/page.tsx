import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-utils"
import NewQuoteForm from "./NewQuoteForm"
import PageLayout from "@/components/layout/PageLayout"
import { Card } from "@/components/ui/Card"

export default async function NewQuotePage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/quotes/new")
  }

  if (!session.user.displayName) {
    redirect("/auth/signin?callbackUrl=/quotes/new")
  }

  return (
    <PageLayout maxWidth="content">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <span className="text-5xl">✨</span>
        </div>
        <h1 className="heading-2 mb-3">Add New Quote</h1>
        <p className="text-body-secondary max-w-2xl mx-auto">
          Share a memorable quote from your favorite movie or TV show. 
          Help others discover the magic of cinema through iconic dialogue.
        </p>
      </div>

      <Card className="animate-scale-in">
        <NewQuoteForm userId={session.user.id} />
      </Card>
    </PageLayout>
  )
}