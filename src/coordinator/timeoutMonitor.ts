import { prisma } from '@/lib/db'

export class TimeoutMonitor {
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private checkInterval = 5000 // 5 seconds

  async start() {
    if (this.isRunning) {
      console.log('Timeout monitor is already running')
      return
    }

    this.isRunning = true
    console.log('Starting timeout monitor')

    this.intervalId = setInterval(async () => {
      try {
        await this.checkTimeouts()
      } catch (error) {
        console.error('Error in timeout monitor:', error)
      }
    }, this.checkInterval)
  }

  async stop() {
    if (!this.isRunning) {
      console.log('Timeout monitor is not running')
      return
    }

    console.log('Stopping timeout monitor')
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
        console.log(`Job ${job.id} has timed out`)
        
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
            
            console.log(`Job ${job.id} will retry at ${nextRetryAt.toISOString()}`)
          } else {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                completedAt: now,
                error: `Job timed out after ${job.attemptCount} attempts`,
              },
            })
            
            console.log(`Job ${job.id} permanently failed after ${job.attemptCount} attempts`)
          }
        } catch (error) {
          console.error(`Failed to handle timeout for job ${job.id}:`, error)
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