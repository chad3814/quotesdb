import { JobType } from '@prisma/client'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

const COORDINATOR_URL = process.env.COORDINATOR_URL || 'http://localhost:3001'
const POLL_INTERVAL = 2000 // 2 seconds

class ExampleRunner {
  private runnerId: string
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null

  constructor() {
    this.runnerId = `runner-${crypto.randomUUID()}`
  }

  async start() {
    if (this.isRunning) {
      logger.info('Runner already running', { runnerId: this.runnerId })
      return
    }

    this.isRunning = true
    logger.info('Starting example runner', { runnerId: this.runnerId })

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
      logger.info('Runner not running', { runnerId: this.runnerId })
      return
    }

    logger.info('Stopping example runner', { runnerId: this.runnerId })
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async pollForJob() {
    logger.info('Polling for a job')
    try {
      const response = await fetch(`${COORDINATOR_URL}/jobs/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runner_id: this.runnerId,
          types: [JobType.TMDB_SYNC, JobType.BATCH_QUOTE_PROCESS]
        })
      })

      if (response.status === 204) {
        logger.info('No jobs available');
        return
      }

      if (!response.ok) {
        logger.error(`failed to claim a job: ${response.statusText}`)
        throw new Error(`Failed to claim job: ${response.statusText}`)
      }

      const job = await response.json()
      logger.info('Claimed job', { jobId: job.id, type: job.type, runnerId: this.runnerId })

      await this.processJob(job)
    } catch (error) {
      logger.error('Error in pollForJob:', error)
    }
  }

  private async processJob(job: { id: string; type: string; arguments: unknown }) {
    try {
      logger.info('Processing job', { jobId: job.id, type: job.type })

      let result: Record<string, unknown> | undefined
      let success = true
      let error: string | undefined

      switch (job.type) {
        case JobType.TMDB_SYNC:
          result = await this.processTmdbSync(job.arguments)
          break
        
        case JobType.BATCH_QUOTE_PROCESS:
          result = await this.processBatchQuotes(job.arguments)
          break
        
        default:
          success = false
          error = `Unknown job type: ${job.type}`
          logger.error('Unknown job type', { jobType: job.type })
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

  private async processTmdbSync(args: unknown): Promise<Record<string, unknown>> {
    logger.info('Processing TMDB sync', { args })
    
    // Simulate TMDB API call and processing
    await this.simulateWork(3000, 8000)
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('TMDB API rate limit exceeded')
    }
    
    return {
      moviesUpdated: Math.floor(Math.random() * 10),
      showsUpdated: Math.floor(Math.random() * 5),
      timestamp: new Date().toISOString()
    }
  }

  private async processBatchQuotes(args: unknown): Promise<Record<string, unknown>> {
    logger.info('Processing batch quotes', { args })
    
    // Simulate quote processing
    await this.simulateWork(5000, 15000)
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.15) {
      throw new Error('Database connection lost during batch processing')
    }
    
    const quotesProcessed = Math.floor(Math.random() * 100) + 1
    
    return {
      quotesProcessed,
      successful: quotesProcessed,
      failed: 0,
      timestamp: new Date().toISOString()
    }
  }

  private async simulateWork(minMs: number, maxMs: number) {
    const duration = minMs + Math.random() * (maxMs - minMs)
    logger.debug('Simulating work', { duration })
    await new Promise(resolve => setTimeout(resolve, duration))
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
        throw new Error(`Failed to report completion: ${response.statusText}`)
      }

      logger.info('Reported job completion', { 
        jobId, 
        success, 
        runnerId: this.runnerId 
      })
    } catch (error) {
      logger.error('Error reporting job completion:', error)
    }
  }
}

// Main execution
async function main() {
  const runner = new ExampleRunner()
  
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down...')
    await runner.stop()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down...')
    await runner.stop()
    process.exit(0)
  })
  
  await runner.start()
  logger.info('Example runner started, press Ctrl+C to stop')
}

// Only run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error in example runner:', error)
    process.exit(1)
  })
}

export { ExampleRunner }