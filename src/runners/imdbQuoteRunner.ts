import { JobType } from '@prisma/client'
import { logger } from '@/lib/logger'
import crypto from 'crypto'
import * as fetchImdbQuotesRunner from './fetchImdbQuotesRunner'

const COORDINATOR_URL = process.env.COORDINATOR_URL || 'http://localhost:3001'
const POLL_INTERVAL = 5000 // 5 seconds

class ImdbQuoteRunner {
  private runnerId: string
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.runnerId = `imdb-runner-${crypto.randomUUID()}`
  }

  async start() {
    if (this.isRunning) {
      logger.info('IMDb Quote Runner already running', { runnerId: this.runnerId })
      return
    }

    this.isRunning = true
    logger.info('Starting IMDb Quote runner', { runnerId: this.runnerId })

    this.intervalId = setInterval(async () => {
      try {
        await this.pollForJob()
      } catch (error) {
        logger.error('Error polling for jobs:', error)
      }
    }, POLL_INTERVAL)
  }

  async stop() {
    if (!this.isRunning) {
      logger.info('IMDb Quote Runner not running', { runnerId: this.runnerId })
      return
    }

    logger.info('Stopping IMDb Quote runner', { runnerId: this.runnerId })
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async pollForJob() {
    logger.debug('Polling for IMDb quote jobs')
    try {
      const response = await fetch(`${COORDINATOR_URL}/jobs/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runner_id: this.runnerId,
          types: [JobType.FETCH_IMDB_QUOTES]
        })
      })

      if (response.status === 204) {
        logger.debug('No IMDb quote jobs available')
        return
      }

      if (!response.ok) {
        logger.error(`Failed to claim a job: ${response.statusText}`)
        throw new Error(`Failed to claim job: ${response.statusText}`)
      }

      const job = await response.json()
      logger.info('Claimed IMDb quote job', { jobId: job.id, type: job.type, runnerId: this.runnerId })

      await this.processJob(job)
    } catch (error) {
      logger.error('Error in pollForJob:', error)
    }
  }

  private async processJob(job: { id: string; type: string; arguments: unknown }) {
    try {
      logger.info('Processing IMDb quote job', { jobId: job.id, type: job.type })

      let result: Record<string, unknown> | undefined
      let success = true
      let error: string | undefined

      if (job.type === JobType.FETCH_IMDB_QUOTES) {
        try {
          const fetchResult = await fetchImdbQuotesRunner.run(job.arguments as Parameters<typeof fetchImdbQuotesRunner.run>[0])
          result = fetchResult as unknown as Record<string, unknown>
        } catch (err) {
          success = false
          error = err instanceof Error ? err.message : 'Unknown error'
          logger.error('Error fetching IMDb quotes', { error, jobId: job.id })
        }
      } else {
        success = false
        error = `Unexpected job type: ${job.type}`
        logger.error('Unexpected job type', { jobType: job.type })
      }

      await this.reportCompletion(job.id, success, result, error)
    } catch (error) {
      logger.error('Error processing job:', error)
      await this.reportCompletion(
        job.id, 
        false, 
        undefined, 
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  private async reportCompletion(
    jobId: string, 
    success: boolean, 
    result?: Record<string, unknown>, 
    error?: string
  ) {
    try {
      const response = await fetch(`${COORDINATOR_URL}/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runner_id: this.runnerId,
          success,
          result,
          error
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('Failed to report job completion', { 
          jobId, 
          status: response.status, 
          error: errorData 
        })
      } else {
        logger.info('Job completion reported', { jobId, success })
      }
    } catch (error) {
      logger.error('Error reporting job completion:', error)
    }
  }
}

// Handle graceful shutdown
let runner: ImdbQuoteRunner | null = null

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  if (runner) {
    await runner.stop()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  if (runner) {
    await runner.stop()
  }
  process.exit(0)
})

// Start the runner if this file is executed directly
if (require.main === module) {
  runner = new ImdbQuoteRunner()
  runner.start()
    .then(() => logger.info('IMDb Quote runner started successfully'))
    .catch(error => {
      logger.error('Failed to start IMDb Quote runner:', error)
      process.exit(1)
    })
}

export default ImdbQuoteRunner