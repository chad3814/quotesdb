import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-utils"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { provider } = await request.json()

    if (!provider || typeof provider !== "string") {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    // Check if user has multiple accounts
    const userAccounts = await db.account.findMany({
      where: { userId: session.user.id },
    })

    if (userAccounts.length <= 1) {
      return NextResponse.json(
        { error: "You must have at least one connected account to maintain access to your account." },
        { status: 400 }
      )
    }

    // Find the account to unlink
    const accountToUnlink = userAccounts.find(acc => acc.provider === provider)
    
    if (!accountToUnlink) {
      return NextResponse.json(
        { error: "Account not found or not linked to your profile." },
        { status: 404 }
      )
    }

    // Delete the account
    await db.account.delete({
      where: { id: accountToUnlink.id },
    })

    return NextResponse.json({ 
      success: true,
      message: `${provider} account unlinked successfully`
    })
  } catch (error) {
    console.error("Account unlinking error:", error)
    return NextResponse.json(
      { error: "Unable to unlink account. Please try again." },
      { status: 500 }
    )
  }
}