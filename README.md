# QuotesDB

A NextJS application for managing famous quotes from movies and TV shows, built with TypeScript and PostgreSQL.

## Features

- **Comprehensive Quote Management**: Store quotes with character attribution, timestamps, and stage directions
- **Multi-Character Support**: Handle quotes with multiple speakers and stage directions
- **Character Tracking**: Track characters across multiple movies and TV shows with actor information
- **TMDB Integration**: Link to The Movie Database for detailed movie and TV show information
- **GitOps Deployment**: Automated deployments with staging, production, and PR environments
- **Database Branching**: Quick database duplication for PR environments

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker, GitHub Actions, GitOps workflow
- **External APIs**: The Movie Database (TMDB)

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/quotesdb.git
   cd quotesdb
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in your database URL and TMDB API key.

4. **Set up the database**:
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses a comprehensive schema supporting:

- **Movies & TV Shows**: Basic information with TMDB linking
- **Characters**: Character definitions with multi-media support
- **Actors**: Actor information with character portrayals
- **Quotes**: Multi-line quotes with timestamps and character attribution
- **Quote Lines**: Individual lines within quotes (dialogue, stage directions, narration)

## Deployment

The project uses a GitOps workflow with:

- **Production**: Deployed from `main` branch
- **Staging**: Deployed from `develop` branch  
- **PR Environments**: Temporary environments with database duplication

### Environment Setup

Required GitHub Secrets:
- `PRODUCTION_DATABASE_URL`
- `STAGING_DATABASE_URL`
- `TMDB_API_KEY`
- `GITOPS_TOKEN`
- Database provider credentials (AWS/Supabase)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Open a PR - this will create a temporary environment
4. After review, merge to `develop` for staging deployment
5. Merge to `main` for production deployment