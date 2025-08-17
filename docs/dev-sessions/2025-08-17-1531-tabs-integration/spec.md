# Session Specification

## Overview

Integrate the Tabstack API to automatically fetch movie quotes from IMDb when new movies are added to the database. This will use a queue-based system for reliable, asynchronous processing.

## Core Requirements

### 1. Tabstack API Integration
- Use the Tabstack API (`https://api.tabstack.ai/`) to scrape IMDb quote pages
- Authentication via Bearer token stored in `TABSTACK_TOKEN` environment variable
- Target URL pattern: `https://www.imdb.com/title/{imdbId}/quotes/`
- Use the `/json` endpoint with a custom schema to extract structured quote data

### 2. Quote Data Extraction
- Parse quote text with proper character attribution
- Identify and differentiate:
  - Character dialogue (with character name)
  - Stage directions (LineType.STAGE_DIRECTION)
  - Narration (LineType.NARRATION)
- Extract IMDb quote IDs from share links (format: `qt0259148`)
- Create Character records for new characters (without actor linking)

### 3. Queue System Architecture
**Note: Queue system will be implemented in a separate branch/session first**
- Database-backed queue using PostgreSQL
- Two tables: queued_jobs and running_jobs
- Atomic job transitions using transactions
- Separate worker process (same repo, different deployment)
- Job types include "fetch_imdb_quotes"

### 4. Quote Import Job Behavior
- Automatically queued when a new movie with IMDb ID is added
- Retry strategy:
  - Exponential backoff starting at 4 seconds, doubling each time
  - Maximum 10 retry attempts
  - 404 errors or empty results: mark as complete (no action needed)
  - Other errors: requeue to back of queue

### 5. Database Schema Updates
- Add `imdbQuoteId` field to Quote model (nullable, unique)
- Existing queue system tables (to be defined in separate session):
  - queued_jobs table
  - running_jobs table
  - completed_jobs table (with success/failure status)
  - failed_jobs table

### 6. Duplicate Handling
- If quote has same `imdbQuoteId`: update existing quote
- If existing quote has no `imdbQuoteId` (manually added): keep manual version, skip IMDb version
- New quotes: create with IMDb quote ID

### 7. Admin Interface
- New `/admin` route (authentication required)
- Initially view-only for job queue monitoring:
  - View queued jobs
  - View running jobs
  - View completed jobs (with import statistics)
  - View failed jobs
- Bulk queue operation: queue quote fetching for existing movies with IMDb IDs
- Job completion statistics:
  - Number of quotes imported
  - Number of characters created

### 8. Deployment Architecture
- Worker process in same repository
- Shares Prisma schema with main app
- Separate deployment configuration in GitOps repo
- Independent scaling from main Next.js application

## Implementation Phases

### Phase 1: Queue System (separate branch)
1. Design and implement database schema for job queue
2. Create worker process structure
3. Implement job processing logic
4. Set up deployment configuration

### Phase 2: Tabstack Integration (this branch)
1. Add `imdbQuoteId` to Quote model
2. Implement Tabstack API client
3. Create quote parsing logic
4. Implement quote import job handler

### Phase 3: Admin Interface
1. Create `/admin` route with authentication
2. Build job queue monitoring UI
3. Add bulk queue operations
4. Display job statistics

### Phase 4: Integration
1. Hook movie creation to queue quote fetching
2. Test end-to-end flow
3. Deploy worker process
4. Monitor and adjust retry strategies

## Success Criteria
- New movies with IMDb IDs automatically get quotes imported
- Quotes are correctly parsed with character attribution
- Failed jobs retry with exponential backoff
- Admin can monitor job queue status
- No duplicate quotes when re-importing
- Manual quotes are preserved over IMDb imports