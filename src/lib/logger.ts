import winston from 'winston'

const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
    }),
  ],
})

export function logJobCreated(jobId: string, type: string) {
  logger.info('Job created', { jobId, type, event: 'job_created' })
}

export function logJobClaimed(jobId: string, runnerId: string) {
  logger.info('Job claimed', { jobId, runnerId, event: 'job_claimed' })
}

export function logJobCompleted(jobId: string, runnerId: string, success: boolean) {
  logger.info('Job completed', { jobId, runnerId, success, event: 'job_completed' })
}

export function logJobFailed(jobId: string, error: string, attemptCount: number) {
  logger.warn('Job failed', { jobId, error, attemptCount, event: 'job_failed' })
}

export function logJobTimeout(jobId: string, timeoutMs: number) {
  logger.warn('Job timed out', { jobId, timeoutMs, event: 'job_timeout' })
}

export function logJobRetry(jobId: string, attemptCount: number, nextRetryAt: Date) {
  logger.info('Job scheduled for retry', { 
    jobId, 
    attemptCount, 
    nextRetryAt: nextRetryAt.toISOString(), 
    event: 'job_retry' 
  })
}

export function logJobCancelled(jobId: string) {
  logger.info('Job cancelled', { jobId, event: 'job_cancelled' })
}