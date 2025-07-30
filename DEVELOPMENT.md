# Development Setup Guide

This guide covers the development setup for the QuotesDB application, including OAuth provider configuration for the authentication system.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Git repository cloned

## Initial Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Database setup**:
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

3. **Environment configuration**:
   Copy the example environment file and configure your variables:
   ```bash
   cp .env.local.example .env.local
   ```

## OAuth Provider Setup

The application uses NextAuth 5.0.0-beta with three OAuth providers: Google, GitHub, and Apple. You'll need to set up each provider to enable authentication.

### Google OAuth Setup

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

### GitHub OAuth Setup

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

### Apple OAuth Setup

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

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/quotesdb"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_PRIVATE_KEY=your-apple-private-key

# TMDB API (for movie/TV data)
TMDB_API_KEY=your-tmdb-api-key
```

## Development Commands

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Run linting**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Run tests**: `npm test`

### Database Commands

- **Run migrations**: `npm run db:migrate`
- **Generate Prisma client**: `npm run db:generate`
- **Push schema changes**: `npm run db:push`
- **Open database studio**: `npm run db:studio`

## Authentication System

The application includes a complete authentication system with the following features:

- **OAuth Providers**: Google, GitHub, and Apple sign-in
- **User Registration**: First-time users must set a unique display name (max 15 characters)
- **Access Control**: Public browsing, authenticated quote creation
- **User Management**: Settings page with display name editing and account linking
- **Session Management**: Database-based sessions with NextAuth 5.0.0-beta

### Authentication Flow

1. Users can browse quotes without authentication
2. Creating quotes requires sign-in via OAuth provider
3. First-time users complete profile setup with display name
4. Users can manage their account via the settings page

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **OAuth errors**: Verify callback URLs match exactly in provider settings
3. **Environment variables**: Ensure all required variables are set in `.env.local`
4. **Prisma issues**: Run `npm run db:generate` after schema changes

### Development Tips

- Use `npm run db:studio` to visually inspect the database
- Check browser developer tools for authentication errors
- Verify OAuth provider settings if sign-in fails
- Run `npm run typecheck` to catch TypeScript errors

## Production Deployment

1. Set up production database
2. Configure production OAuth callback URLs
3. Set production environment variables
4. Run database migrations
5. Build and deploy application

Refer to your hosting provider's documentation for specific deployment instructions.