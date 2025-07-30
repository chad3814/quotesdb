import { NextRequest, NextResponse } from "next/server"
import { getServerSession, updateUserDisplayName } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { displayName } = await request.json()

    if (!displayName || typeof displayName !== "string") {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 })
    }

    const result = await updateUserDisplayName(session.user.id, displayName)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      user: result.user 
    })
  } catch (error) {
    console.error("Display name update error:", error)
    return NextResponse.json(
      { error: "Unable to update display name. Please try again." },
      { status: 500 }
    )
  }
}