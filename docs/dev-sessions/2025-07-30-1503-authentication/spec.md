# Authentication Session Spec

## Overview
Implement user authentication for the quotes database application using NextAuth 5.0.0-beta with OAuth providers (Google and GitHub). The system will support mixed authentication where browsing quotes is public but adding quotes requires authentication.

## Requirements

### Authentication System
- **Framework**: NextAuth 5.0.0-beta
- **OAuth Providers**: Google, GitHub, and Apple
- **Database Integration**: Integrate user management directly into existing Prisma schema
- **Session Management**: Use NextAuth's built-in session management

### User Registration Flow
- OAuth sign-in with Google, GitHub, or Apple
- First-time users must complete profile setup with display name
- Display name requirements:
  - Maximum 15 characters
  - Must be unique across all users
  - No other character restrictions
- Profile setup via dedicated modal that blocks user interaction until completed

### Authentication UI/UX
- **Primary Flow**: Open authentication in popup window
- **Fallback 1**: If popup fails, open in new tab
- **Fallback 2**: If new tab fails, use current browsing session and redirect back after completion
- **Modal Blocking**: First-time users cannot proceed without setting display name

### Access Control
- **Public Access**: Browsing quotes (no authentication required)
- **Protected Access**: Adding quotes (authentication required)
- **Future Scope**: Quote editing (not included in this session)

### Quote Ownership
- Track quote creatorship by associating quotes with user ID
- Display of quote contributors deferred to future sessions

### Error Handling
Display clear error messages for:
- Authentication cancellation: "Authentication was cancelled. You'll need to sign in to add quotes."
- OAuth provider errors: "There was a problem signing in with [Google/GitHub/Apple]. Please try again."
- Display name conflicts: "That display name is already in use. Please choose another."
- Network/server errors: "Unable to complete sign-in. Please check your connection and try again."

### User Settings Page
- Dedicated settings page for authenticated users
- **Display Name Management**: Allow users to update their display name (with same validation rules)
- **Account Linking**: Show connected OAuth providers (Google/GitHub/Apple) and allow linking additional providers
- **Access Control**: Only accessible to authenticated users

### Sign-out Functionality
- Implement user sign-out capability
- Clear session and return to previous state

## Success Criteria
- [ ] NextAuth 5.0.0-beta installed and configured
- [ ] Google, GitHub, and Apple OAuth providers configured
- [ ] Database schema updated with user management
- [ ] Popup-based authentication flow with fallbacks implemented
- [ ] First-time user profile setup modal implemented
- [ ] Display name validation (uniqueness and length) working
- [ ] Quote creation restricted to authenticated users
- [ ] Quote ownership tracking implemented
- [ ] Error handling for all authentication scenarios
- [ ] Sign-out functionality implemented
- [ ] User settings page implemented with display name editing
- [ ] Account linking functionality for multiple OAuth providers
- [ ] All authentication flows tested and working
- [ ] Developer documentation for OAuth credential setup created

## Developer Documentation

### OAuth Provider Setup

#### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure consent screen if prompted
6. Set application type to "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
8. Copy Client ID and Client Secret to environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

#### GitHub OAuth Setup
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: Your app name
   - Homepage URL: Your app URL
   - Authorization callback URL: 
     - `http://localhost:3000/api/auth/callback/github` (development)
     - `https://yourdomain.com/api/auth/callback/github` (production)
4. Copy Client ID and generate Client Secret
5. Add to environment variables:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`

#### Apple OAuth Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Create a new App ID or select existing one
4. Enable "Sign In with Apple" capability
5. Create a Services ID:
   - Configure domains and subdomains
   - Set return URLs:
     - `http://localhost:3000/api/auth/callback/apple` (development)
     - `https://yourdomain.com/api/auth/callback/apple` (production)
6. Create a private key for Sign In with Apple
7. Add to environment variables:
   - `APPLE_CLIENT_ID` (Services ID)
   - `APPLE_CLIENT_SECRET` (Generated JWT using private key)
   - `APPLE_KEY_ID`
   - `APPLE_TEAM_ID`
   - `APPLE_PRIVATE_KEY`

#### Environment Variables Setup
Create a `.env.local` file with:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_PRIVATE_KEY=your-apple-private-key
```