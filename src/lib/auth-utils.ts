import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function getServerSession() {
  return await auth()
}

export async function createUserProfile(userId: string, displayName: string) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { displayName },
    })
    return { success: true, user: updatedUser }
  } catch (error) {
    return { success: false, error: "Failed to create user profile" }
  }
}

export async function validateDisplayName(displayName: string) {
  if (!displayName || displayName.trim().length === 0) {
    return { valid: false, error: "Display name is required" }
  }
  
  if (displayName.length > 15) {
    return { valid: false, error: "Display name must be 15 characters or less" }
  }
  
  return { valid: true }
}

export async function checkDisplayNameUnique(displayName: string, currentUserId?: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { displayName },
    })
    
    if (existingUser && existingUser.id !== currentUserId) {
      return { unique: false, error: "That display name is already in use. Please choose another." }
    }
    
    return { unique: true }
  } catch (error) {
    return { unique: false, error: "Unable to check display name availability" }
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    })
    return user
  } catch (error) {
    return null
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
      },
    })
    return user
  } catch (error) {
    return null
  }
}

export async function updateUserDisplayName(userId: string, displayName: string) {
  try {
    const validation = await validateDisplayName(displayName)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }
    
    const uniqueCheck = await checkDisplayNameUnique(displayName, userId)
    if (!uniqueCheck.unique) {
      return { success: false, error: uniqueCheck.error }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { displayName },
    })
    
    return { success: true, user: updatedUser }
  } catch (error) {
    return { success: false, error: "Unable to update display name. Please try again." }
  }
}