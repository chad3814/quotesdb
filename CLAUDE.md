# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server**: `npm run dev`
**Build for production**: `npm run build`
**Run linting**: `npm run lint`
**Type checking**: `npm run typecheck`
**Run tests**: `npm test`

**Database operations**:
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio for database management

## Architecture Overview

This is a Next.js 15 application for managing movie and TV show quotes with the following architecture:

### Core Stack
- **Frontend**: Next.js 15 with App Router, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth 5.0.0-beta with OAuth providers (Google, GitHub, Apple)
- **External APIs**: The Movie Database (TMDB) for media metadata

### Database Schema Architecture
The database uses a comprehensive relational model:

- **Media Hierarchy**: Movies and TV Shows → Seasons → Episodes
- **Character System**: Characters can be portrayed by different Actors across multiple media
- **Quote Structure**: Quotes contain multiple QuoteLines with different LineTypes (DIALOGUE, STAGE_DIRECTION, NARRATION)
- **User Management**: Users with OAuth accounts, sessions, and unique display names
- **TMDB Integration**: All media entities can link to TMDB IDs for external metadata

Key relationships:
- CharacterPortrayal links Characters to Actors in specific media contexts
- QuoteLines support timestamps for audio/video synchronization
- Quotes are linked to either Movies or Episodes, with creator tracking
- All entities use CUID for primary keys

### Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/app/api/auth/` - Authentication endpoints and profile setup
- `src/app/api/quotes/` - Quote management API
- `src/app/api/movies/` - Movie management and TMDB import API
- `src/app/api/user/` - User management endpoints
- `src/app/movies/add/` - UI for importing movies from TMDB
- `src/lib/db.ts` - Prisma client singleton with development hot-reloading
- `src/lib/auth.ts` - NextAuth configuration
- `src/lib/tmdb.ts` - TMDB API integration service
- `prisma/schema.prisma` - Database schema definition

### Configuration
- Uses TypeScript with strict mode and path aliases (`@/*` → `./src/*`)
- Tailwind CSS configured for app directory structure
- Jest configured with jsdom for React component testing
- Environment variables: DATABASE_URL, TMDB_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL, OAuth provider credentials

## Development Notes

**Testing**: Uses Jest with jsdom environment for React component testing

**Database Development**: 
- Always run `npm run db:generate` after schema changes
- Use `npm run db:studio` for visual database inspection
- Migration workflow: modify schema → `npm run db:migrate` → `npm run db:generate`

**Authentication Setup**:
- OAuth providers require configuration in respective developer consoles
- Callback URLs must match exactly: `/api/auth/callback/{provider}`
- First-time users must set a unique display name (max 15 characters)

**TMDB Integration**:
- Import movies individually by TMDB ID or in bulk from TMDB lists
- Movie data includes title, release year, and TMDB ID
- Duplicate imports are prevented (checks by TMDB ID)
- Access the import page at `/movies/add`

**Deployment**: Supports GitOps workflow with staging and production environments, including PR-based temporary environments with database branching