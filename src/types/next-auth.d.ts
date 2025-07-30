import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      displayName?: string | null
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    displayName?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    displayName?: string | null
  }
}