import { JobType, Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db'
import { 
  logJobCreated, 
  logJobClaimed, 
  logJobCompleted, 
  logJobFailed, 
  logJobRetry,
  logJobCancelled
} from '@/lib/logger'

type CreateJobInput = {
  type: JobType
  arguments: Prisma.InputJsonValue
  timeoutMs?: number
}

const DEFAULT_TIMEOUTS: Record<JobType, number> = {
  [JobType.TMDB_SYNC]: 30000, // 30 seconds
  [JobType.BATCH_QUOTE_PROCESS]: 60000, // 60 seconds
  [JobType.FETCH_IMDB_QUOTES]: 45000, // 45 seconds
}

export async function createJob({ type, arguments: args, timeoutMs }: CreateJobInput) {
  const timeout = timeoutMs ?? DEFAULT_TIMEOUTS[type]
  
  const job = await prisma.job.create({
    data: {
      type,
      arguments: args,
      timeoutMs: timeout,
    },
  })
  
  logJobCreated(job.id, type)
  return job
}

export async function getJob(id: string) {
  return await prisma.job.findUnique({
    where: { id },
  })
}

export async function claimJob(runnerId: string, types?: JobType[]) {
  return await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
    const now = new Date()
    
    const whereClause: Prisma.JobWhereInput = {
      claimedAt: null,
      completedAt: null,
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: now } },
      ],
      ...(types && types.length > 0 ? { type: { in: types } } : {}),
    }
    
    const job = await tx.job.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    })
    
    if (!job) {
      return null
    }
    
    const claimedJob = await tx.job.update({
      where: { id: job.id },
      data: {
        claimedAt: now,
        runnerId,
      },
    })
    
    logJobClaimed(claimedJob.id, runnerId)
    return claimedJob
  })
}

function getRetryDelay(attemptCount: number): number {
  const baseDelayMs = 4000 + Math.random() * 4000 // 4-8 seconds
  const multiplier = Math.pow(2, attemptCount)
  const delayMs = baseDelayMs * multiplier
  const maxDelayMs = 3600000 // 1 hour
  return Math.min(delayMs, maxDelayMs)
}

export async function completeJob(
  jobId: string,
  runnerId: string,
  success: boolean,
  result?: Prisma.InputJsonValue,
  error?: string
) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }
  
  if (job.runnerId !== runnerId) {
    throw new Error(`Job ${jobId} is not claimed by runner ${runnerId}`)
  }
  
  const now = new Date()
  
  if (success) {
    const completedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        completedAt: now,
        result,
      },
    })
    logJobCompleted(jobId, runnerId, true)
    return completedJob
  } else {
    const newAttemptCount = job.attemptCount + 1
    const shouldRetry = newAttemptCount < 10
    
    if (shouldRetry) {
      const retryDelayMs = getRetryDelay(newAttemptCount)
      const nextRetryAt = new Date(now.getTime() + retryDelayMs)
      
      const retriedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          attemptCount: newAttemptCount,
          claimedAt: null,
          runnerId: null,
          nextRetryAt,
          error,
        },
      })
      
      logJobRetry(jobId, newAttemptCount, nextRetryAt)
      return retriedJob
    } else {
      const failedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
          completedAt: now,
          error,
        },
      })
      
      logJobFailed(jobId, error || 'Unknown error', job.attemptCount)
      return failedJob
    }
  }
}

export async function cancelJob(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`)
  }
  
  if (job.completedAt) {
    throw new Error(`Job ${jobId} is already completed`)
  }
  
  const cancelledJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      completedAt: new Date(),
      error: 'Job cancelled',
    },
  })
  
  logJobCancelled(jobId)
  return cancelledJob
}