import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-utils"
import AddMoviesForm from "./AddMoviesForm"
import PageLayout from "@/components/layout/PageLayout"
import { Card, CardContent } from "@/components/ui/Card"

export default async function AddMoviesPage() {
  const session = await getServerSession()

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/movies/add")
  }

  return (
    <PageLayout maxWidth="content">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center mb-4">
          <span className="text-5xl">🎆</span>
        </div>
        <h1 className="heading-2 mb-3">Import Movies</h1>
        <p className="text-body-secondary max-w-2xl mx-auto">
          Import movies from The Movie Database (TMDB) by individual ID or from curated lists. 
          Build your collection with detailed cast information.
        </p>
      </div>

      <Card className="animate-scale-in mb-8">
        <AddMoviesForm />
      </Card>

      <Card variant="elevated" className="animate-slide-in">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="heading-5 mb-3">How to find TMDB IDs</h3>
              <div className="space-y-3 text-sm text-text-secondary">
                <div>
                  <span className="font-semibold text-text-primary">Movie ID:</span> Visit a movie on{" "}
                  <a 
                    href="https://www.themoviedb.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline transition-colors"
                  >
                    themoviedb.org
                  </a>
                  . The ID appears in the URL (e.g., /movie/<span className="font-mono bg-surface-100 px-1 rounded">550</span> for Fight Club)
                </div>
                <div>
                  <span className="font-semibold text-text-primary">List ID:</span> Browse{" "}
                  <a 
                    href="https://www.themoviedb.org/lists" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline transition-colors"
                  >
                    public lists
                  </a>
                  . The ID appears in the URL (e.g., /list/<span className="font-mono bg-surface-100 px-1 rounded">7060919</span>)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}