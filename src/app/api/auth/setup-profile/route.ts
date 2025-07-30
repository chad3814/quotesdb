import { NextRequest, NextResponse } from "next/server"
import { getServerSession, validateDisplayName, checkDisplayNameUnique, createUserProfile } from "@/lib/auth-utils"

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

    // Validate display name
    const validation = await validateDisplayName(displayName)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check uniqueness
    const uniqueCheck = await checkDisplayNameUnique(displayName)
    if (!uniqueCheck.unique) {
      return NextResponse.json({ error: uniqueCheck.error }, { status: 400 })
    }

    // Create user profile
    const result = await createUserProfile(session.user.id, displayName)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      user: result.user 
    })
  } catch (error) {
    console.error("Profile setup error:", error)
    return NextResponse.json(
      { error: "Unable to save display name. Please try again." },
      { status: 500 }
    )
  }
}