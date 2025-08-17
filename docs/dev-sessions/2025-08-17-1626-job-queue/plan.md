# Job Queue Implementation Plan

## Phase 1: Database Foundation

### Step 1.1: Define Prisma Schema
Create the Job model in the Prisma schema with all necessary fields and enums.

**Prompt 1:**
```
Add a Job model to the Prisma schema with these fields:
- id (CUID primary key)
- type (enum: TMDB_SYNC, BATCH_QUOTE_PROCESS)
- arguments (JSON)
- runnerId (String, optional)
- attemptCount (Int, default 0)
- timeoutMs (Int)
- result (JSON, optional)
- error (String, optional)
- createdAt (DateTime)
- claimedAt (DateTime, optional)
- completedAt (DateTime, optional)
- nextRetryAt (DateTime, optional)

Add appropriate indexes for querying pending jobs and monitoring timeouts.
```

### Step 1.2: Generate and Apply Migration
Run Prisma migration to create the database table.

**Prompt 2:**
```
Generate and apply the Prisma migration for the Job model. Ensure the migration runs successfully and update the Prisma client.
```

## Phase 2: Core Job Service

### Step 2.1: Create Job Service Module
Build the core job service with basic CRUD operations.

**Prompt 3:**
```
Create src/lib/jobs/jobService.ts with:
- createJob(type, arguments, timeoutMs?) function
- getJob(id) function
- Basic type definitions for JobType enum
- Default timeout values per job type (30 seconds for TMDB_SYNC, 60 seconds for BATCH_QUOTE_PROCESS)
```

### Step 2.2: Add Job Claiming Logic
Implement atomic job claiming with transaction support.

**Prompt 4:**
```
Add to jobService.ts:
- claimJob(runnerId, types?) function using Prisma transaction
- Should atomically claim oldest pending job (where claimedAt is null and nextRetryAt is null or past)
- Filter by job types if provided
- Update claimedAt and runnerId
- Return the claimed job or null
```

### Step 2.3: Add Job Completion Logic
Implement job completion handling.

**Prompt 5:**
```
Add to jobService.ts:
- completeJob(jobId, runnerId, success, result?, error?) function
- Verify the runnerId matches
- Update completedAt and result/error
- If failed and attemptCount < 10, calculate nextRetryAt with exponential backoff
- Exponential backoff: base delay 4-8 seconds (random), doubles each attempt, max 1 hour
```

## Phase 3: Coordinator Service Setup

### Step 3.1: Create Express Server
Set up the coordinator service structure.

**Prompt 6:**
```
Create src/coordinator/server.ts:
- Express server setup with JSON middleware
- Environment variable configuration (PORT, DATABASE_URL, LOG_LEVEL)
- Basic error handling middleware
- Graceful shutdown handler
- Server starts on port 3001 by default
```

### Step 3.2: Add Health Check Endpoint
Implement the health monitoring endpoint.

**Prompt 7:**
```
Add to coordinator server:
- GET /health endpoint
- Returns { status: 'ok', timestamp: Date }
- Verify database connection is alive
```

## Phase 4: Job Management API

### Step 4.1: Create Job Endpoints
Implement job creation and retrieval endpoints.

**Prompt 8:**
```
Add job management endpoints to coordinator:
- POST /jobs - Create new job using jobService.createJob
- GET /jobs/:id - Get job status using jobService.getJob
- Proper error handling and validation
- Return appropriate HTTP status codes
```

### Step 4.2: Add Cancel Job Endpoint
Implement job cancellation.

**Prompt 9:**
```
Add to coordinator and jobService:
- DELETE /jobs/:id endpoint
- cancelJob(jobId) function in jobService
- Mark job as completed with specific cancellation error
- Only allow cancellation of pending or processing jobs
```

## Phase 5: Runner Operations API

### Step 5.1: Implement Claim Endpoint
Add the job claiming endpoint for runners.

**Prompt 10:**
```
Add to coordinator:
- POST /jobs/claim endpoint
- Accept { runnerId, types? } in body
- Use jobService.claimJob
- Return job or null
- Handle transaction errors gracefully
```

### Step 5.2: Implement Complete Endpoint
Add the job completion endpoint.

**Prompt 11:**
```
Add to coordinator:
- POST /jobs/:id/complete endpoint
- Accept { runnerId, success, result?, error? } in body
- Use jobService.completeJob
- Validate runnerId matches claimed job
- Return updated job record
```

## Phase 6: Timeout Monitor

### Step 6.1: Create Timeout Monitor
Build the background process for handling timeouts.

**Prompt 12:**
```
Create src/coordinator/timeoutMonitor.ts:
- TimeoutMonitor class with start/stop methods
- Runs every 5 seconds
- Queries for jobs where:
  - claimedAt exists
  - completedAt is null
  - current time > claimedAt + (timeoutMs * 1.25)
- Marks timed-out jobs as failed
```

### Step 6.2: Integrate Monitor with Server
Wire the timeout monitor into the coordinator.

**Prompt 13:**
```
Update coordinator server:
- Initialize TimeoutMonitor on startup
- Start monitor after server starts
- Stop monitor on graceful shutdown
- Add monitor status to health check
```

## Phase 7: Retry Logic Implementation

### Step 7.1: Enhance Retry Handling
Improve the retry mechanism with proper scheduling.

**Prompt 14:**
```
Update jobService:
- Modify claimJob to consider nextRetryAt
- Only claim jobs where nextRetryAt is null or in the past
- Add getRetryDelay(attemptCount) helper function
- Implement exponential backoff calculation with jitter
```

### Step 7.2: Add Retry Processing
Ensure failed jobs are properly requeued.

**Prompt 15:**
```
Update completeJob in jobService:
- When job fails and attemptCount < 10:
  - Increment attemptCount
  - Calculate nextRetryAt using getRetryDelay
  - Clear claimedAt and runnerId
  - Keep job available for retry
- After 10 attempts, mark as permanently failed
```

## Phase 8: Logging Infrastructure

### Step 8.1: Add Structured Logging
Implement comprehensive logging throughout the system.

**Prompt 16:**
```
Create src/lib/logger.ts:
- Use a library like winston or pino
- Structured JSON output
- Log levels from environment variable
- Helper methods for common events
Add logging to all key operations in jobService and coordinator
```

## Phase 9: Example Runner Implementation

### Step 9.1: Create Sample Runner
Build an example runner to demonstrate the system.

**Prompt 17:**
```
Create src/runners/exampleRunner.ts:
- Generate unique runner ID
- Poll claim endpoint every 2 seconds
- Process different job types
- Report completion/failure
- Handle errors gracefully
- Demonstrate both TMDB_SYNC and BATCH_QUOTE_PROCESS job types
```

## Phase 10: Testing & Documentation

### Step 10.1: Add Unit Tests
Create comprehensive test coverage.

**Prompt 18:**
```
Create test files for:
- jobService functions (mocking Prisma)
- Retry delay calculations
- Timeout detection logic
- API endpoint validation
Focus on edge cases and error conditions
```

### Step 10.2: Add Integration Tests
Test the complete flow.

**Prompt 19:**
```
Create integration tests:
- Job creation, claiming, and completion flow
- Timeout handling
- Retry mechanism
- Concurrent job claiming
Use a test database and real Prisma client
```

### Step 10.3: Create Development Scripts
Add helpful development utilities.

**Prompt 20:**
```
Create package.json scripts:
- "coordinator:dev" - Run coordinator in development
- "coordinator:build" - Build coordinator for production
- "coordinator:start" - Run coordinator in production
- "runner:example" - Run example runner
Update README with setup instructions
```

## Phase 11: Production Readiness

### Step 11.1: Add Docker Support
Containerize the coordinator service.

**Prompt 21:**
```
Create Dockerfile for coordinator:
- Multi-stage build
- Minimal production image
- Proper signal handling for graceful shutdown
- Health check configuration
```

### Step 11.2: Add Deployment Configuration
Prepare for GitOps deployment.

**Prompt 22:**
```
Create deployment configuration:
- Environment variable template
- Service configuration for Kubernetes/Docker Compose
- Document required environment variables
- Add to GitOps repository structure
```