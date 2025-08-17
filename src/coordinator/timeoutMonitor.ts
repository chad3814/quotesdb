import { prisma } from '@/lib/db'
import { logger, logJobTimeout, logJobRetry, logJobFailed } from '@/lib/logger'

export class TimeoutMonitor {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private checkInterval = 5000 // 5 seconds

  async start() {
    if (this.isRunning) {
      logger.info('Timeout monitor is already running')
      return
    }

    this.isRunning = true
    logger.info('Starting timeout monitor')

    this.intervalId = setInterval(async () => {
      try {
        await this.checkTimeouts()
      } catch (error) {
        logger.error('Error in timeout monitor:', error)
      }
    }, this.checkInterval)
  }

  async stop() {
    if (!this.isRunning) {
      logger.info('Timeout monitor is not running')
      return
    }

    logger.info('Stopping timeout monitor')
    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async checkTimeouts() {
    const now = new Date()
    
    const timedOutJobs = await prisma.job.findMany({
      where: {
        claimedAt: { not: null },
        completedAt: null,
      },
    })

    for (const job of timedOutJobs) {
      if (!job.claimedAt) continue
      
      const timeoutThreshold = job.claimedAt.getTime() + (job.timeoutMs * 1.25)
      
      if (now.getTime() > timeoutThreshold) {
        logJobTimeout(job.id, job.timeoutMs)
        
        try {
          const newAttemptCount = job.attemptCount + 1
          const shouldRetry = newAttemptCount < 10
          
          if (shouldRetry) {
            const retryDelayMs = this.getRetryDelay(newAttemptCount)
            const nextRetryAt = new Date(now.getTime() + retryDelayMs)
            
            await prisma.job.update({
              where: { id: job.id },
              data: {
                attemptCount: newAttemptCount,
                claimedAt: null,
                runnerId: null,
                nextRetryAt,
                error: `Job timed out after ${job.timeoutMs}ms`,
              },
            })
            
            logJobRetry(job.id, newAttemptCount, nextRetryAt)
          } else {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                completedAt: now,
                error: `Job timed out after ${job.attemptCount} attempts`,
              },
            })
            
            logJobFailed(job.id, `Job timed out after ${job.attemptCount} attempts`, job.attemptCount)
          }
        } catch (error) {
          logger.error(`Failed to handle timeout for job ${job.id}:`, error)
        }
      }
    }
  }

  private getRetryDelay(attemptCount: number): number {
    const baseDelayMs = 4000 + Math.random() * 4000 // 4-8 seconds
    const multiplier = Math.pow(2, attemptCount)
    const delayMs = baseDelayMs * multiplier
    const maxDelayMs = 3600000 // 1 hour
    return Math.min(delayMs, maxDelayMs)
  }

  isActive(): boolean {
    return this.isRunning
  }
}