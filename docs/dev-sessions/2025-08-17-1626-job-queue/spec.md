# Job Queue System Specification

## Overview

A general-purpose job queue system for the QuotesDB application that enables asynchronous task processing with automatic retries, timeout handling, and distributed job execution.

## Architecture

### Components

1. **Queue Coordinator Service**
   - Standalone service running alongside Next.js
   - Shares Prisma schema with main application
   - Handles all job state transitions
   - Manages retries and timeouts
   - Deployed via GitOps repository

2. **Job Runners**
   - Can be part of API calls or ephemeral services
   - Claim jobs atomically from coordinator
   - Execute job logic based on type
   - Report results back to coordinator

## Database Schema

### Jobs Table (Single Table Design)
- `id`: CUID primary key
- `type`: Enum of job types
- `arguments`: JSON blob for job-specific parameters
- `status`: Derived from presence in table and timestamps
- `runner_id`: UUID of the runner processing this job
- `attempt_count`: Number of execution attempts (max 10)
- `timeout_ms`: Job-specific timeout in milliseconds
- `result`: JSON blob for output metadata
- `error`: Error message if failed
- `created_at`: Timestamp when job was created
- `claimed_at`: Timestamp when runner claimed the job
- `completed_at`: Timestamp when job finished (success or failure)
- `next_retry_at`: Timestamp for next retry attempt (if applicable)

### Job States (Derived)
- **PENDING**: created_at is set, claimed_at is null
- **PROCESSING**: claimed_at is set, completed_at is null
- **COMPLETED**: completed_at is set, result is populated
- **FAILED**: completed_at is set, error is populated
- **CANCELLED**: completed_at is set, specific flag or error message

## Job Types

Defined as an enum in the schema. Initial types may include:
- `TMDB_SYNC`: Sync movie/show metadata from TMDB
- `BATCH_QUOTE_PROCESS`: Process multiple quotes in batch
- Additional types to be added as needed

Each job type has:
- Default timeout value
- Specific argument structure (not enforced by coordinator)
- Expected result structure (not enforced by coordinator)

## API Endpoints (REST/JSON)

### Coordinator Service

#### Health & Monitoring
- `GET /health` - Service health check

#### Job Management
- `POST /jobs` - Create a new job
  - Body: `{ type, arguments, timeout_ms? }`
  - Returns: `{ id, status, created_at }`
  
- `GET /jobs/:id` - Get job status
  - Returns: Full job record
  
- `DELETE /jobs/:id` - Cancel a job
  - Returns: Updated job record

#### Runner Operations
- `POST /jobs/claim` - Claim next available job
  - Body: `{ runner_id, types?: string[] }` (optionally filter by job types)
  - Returns: Job record or null if none available
  
- `POST /jobs/:id/complete` - Report job completion
  - Body: `{ runner_id, success: boolean, result?: {}, error?: string }`
  - Returns: Updated job record

## Job Processing Flow

1. **Job Creation**
   - Client creates job via POST /jobs
   - Job inserted with PENDING status
   - Immediately available for processing

2. **Job Claiming**
   - Runner calls POST /jobs/claim with its runner_id
   - Coordinator atomically assigns oldest eligible job
   - Updates claimed_at and runner_id
   - Returns job details to runner

3. **Job Execution**
   - Runner processes job based on type and arguments
   - No heartbeat required during execution

4. **Job Completion**
   - Runner reports success/failure to coordinator
   - Coordinator updates completed_at and result/error

## Retry Logic

- Failed jobs automatically requeued up to 10 times
- Exponential backoff with jitter:
  - Initial delay: 4-8 seconds (random)
  - Each retry doubles the delay
  - Max delay capped at reasonable limit (e.g., 1 hour)
- After 10 failed attempts, job remains in FAILED state

## Timeout Handling

- Each job has a timeout value (default per type, configurable per job)
- Coordinator monitors processing jobs
- If no completion received within 1.25x timeout:
  - Job marked as failed
  - Retry logic triggered if attempts remain
  - Runner's result ignored if received after timeout

## Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Service port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging verbosity

### Service Behavior
- Auto-starts job processing on launch
- Supports graceful shutdown:
  - Stops claiming new jobs
  - Waits for current jobs to complete (up to timeout)
  - Cleanly closes database connections

## Security

- Internal-only service (no authentication required)
- Assumes trusted network environment
- No external API access
- Relies on network-level security

## Logging

- Structured JSON logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Key events logged:
  - Job creation/claiming/completion
  - Retry attempts
  - Timeout failures
  - Runner registration/disconnection

## Future Considerations

- Migration to separate tables if performance requires
- Job dependencies and DAG support
- Priority queue implementation
- Rate limiting by job type
- Dead letter queue for permanent failures
- Metrics/monitoring endpoints
- Job scheduling for future execution
- Maximum concurrent jobs by type