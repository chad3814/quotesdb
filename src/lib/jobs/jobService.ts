import { JobType, Prisma, PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/db'

type CreateJobInput = {
  type: JobType
  arguments: any
  timeoutMs?: number
}

const DEFAULT_TIMEOUTS: Record<JobType, number> = {
  [JobType.TMDB_SYNC]: 30000, // 30 seconds
  [JobType.BATCH_QUOTE_PROCESS]: 60000, // 60 seconds
}

export async function createJob({ type, arguments: args, timeoutMs }: CreateJobInput) {
  const timeout = timeoutMs ?? DEFAULT_TIMEOUTS[type]
  
  return await prisma.job.create({
    data: {
      type,
      arguments: args,
      timeoutMs: timeout,
    },
  })
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
    
    return await tx.job.update({
      where: { id: job.id },
      data: {
        claimedAt: now,
        runnerId,
      },
    })
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
  result?: any,
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
    return await prisma.job.update({
      where: { id: jobId },
      data: {
        completedAt: now,
        result,
      },
    })
  } else {
    const newAttemptCount = job.attemptCount + 1
    const shouldRetry = newAttemptCount < 10
    
    if (shouldRetry) {
      const retryDelayMs = getRetryDelay(newAttemptCount)
      const nextRetryAt = new Date(now.getTime() + retryDelayMs)
      
      return await prisma.job.update({
        where: { id: jobId },
        data: {
          attemptCount: newAttemptCount,
          claimedAt: null,
          runnerId: null,
          nextRetryAt,
          error,
        },
      })
    } else {
      return await prisma.job.update({
        where: { id: jobId },
        data: {
          completedAt: now,
          error,
        },
      })
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
  
  return await prisma.job.update({
    where: { id: jobId },
    data: {
      completedAt: new Date(),
      error: 'Job cancelled',
    },
  })
}