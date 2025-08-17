import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { prisma } from '@/lib/db'
import { JobType } from '@prisma/client'
import * as jobService from '@/lib/jobs/jobService'
import { TimeoutMonitor } from './timeoutMonitor'

dotenv.config()

const app = express()
const PORT = process.env.COORDINATOR_PORT || 3001
const timeoutMonitor = new TimeoutMonitor()

app.use(cors())
app.use(express.json())

let isShuttingDown = false

app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: 'Server is shutting down' })
  } else {
    next()
  }
})

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      timeoutMonitor: timeoutMonitor.isActive() ? 'active' : 'inactive'
    })
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      timeoutMonitor: timeoutMonitor.isActive() ? 'active' : 'inactive',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.post('/jobs', async (req, res) => {
  try {
    const { type, arguments: args, timeout_ms } = req.body
    
    if (!type || !Object.values(JobType).includes(type)) {
      return res.status(400).json({ error: 'Invalid job type' })
    }
    
    if (!args || typeof args !== 'object') {
      return res.status(400).json({ error: 'Arguments must be an object' })
    }
    
    const job = await jobService.createJob({
      type,
      arguments: args,
      timeoutMs: timeout_ms
    })
    
    res.status(201).json({
      id: job.id,
      status: 'pending',
      created_at: job.createdAt
    })
  } catch (error) {
    console.error('Error creating job:', error)
    res.status(500).json({ error: 'Failed to create job' })
  }
})

app.get('/jobs/:id', async (req, res) => {
  try {
    const job = await jobService.getJob(req.params.id)
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }
    
    const status = job.completedAt 
      ? (job.error ? 'failed' : 'completed')
      : (job.claimedAt ? 'processing' : 'pending')
    
    res.json({
      ...job,
      status
    })
  } catch (error) {
    console.error('Error getting job:', error)
    res.status(500).json({ error: 'Failed to get job' })
  }
})

app.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await jobService.cancelJob(req.params.id)
    
    res.json({
      ...job,
      status: 'cancelled'
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('already completed')) {
        return res.status(400).json({ error: error.message })
      }
    }
    console.error('Error cancelling job:', error)
    res.status(500).json({ error: 'Failed to cancel job' })
  }
})

app.post('/jobs/claim', async (req, res) => {
  try {
    const { runner_id, types } = req.body
    
    if (!runner_id) {
      return res.status(400).json({ error: 'runner_id is required' })
    }
    
    if (types && !Array.isArray(types)) {
      return res.status(400).json({ error: 'types must be an array' })
    }
    
    const job = await jobService.claimJob(runner_id, types)
    
    if (!job) {
      return res.status(204).send()
    }
    
    res.json(job)
  } catch (error) {
    console.error('Error claiming job:', error)
    res.status(500).json({ error: 'Failed to claim job' })
  }
})

app.post('/jobs/:id/complete', async (req, res) => {
  try {
    const { runner_id, success, result, error } = req.body
    
    if (!runner_id) {
      return res.status(400).json({ error: 'runner_id is required' })
    }
    
    if (typeof success !== 'boolean') {
      return res.status(400).json({ error: 'success must be a boolean' })
    }
    
    const job = await jobService.completeJob(
      req.params.id,
      runner_id,
      success,
      result,
      error
    )
    
    res.json(job)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('not claimed by runner')) {
        return res.status(403).json({ error: error.message })
      }
    }
    console.error('Error completing job:', error)
    res.status(500).json({ error: 'Failed to complete job' })
  }
})

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

const server = app.listen(PORT, async () => {
  console.log(`Job Queue Coordinator running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  
  await timeoutMonitor.start()
  console.log('Timeout monitor started')
})

function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received, starting graceful shutdown...`)
  isShuttingDown = true

  const shutdownTimeout = setTimeout(() => {
    console.error('Graceful shutdown timeout, forcing exit')
    process.exit(1)
  }, 30000)

  server.close(async () => {
    console.log('HTTP server closed')
    
    await timeoutMonitor.stop()
    console.log('Timeout monitor stopped')
    
    try {
      await prisma.$disconnect()
      console.log('Database connection closed')
    } catch (error) {
      console.error('Error closing database connection:', error)
    }
    
    clearTimeout(shutdownTimeout)
    process.exit(0)
  })
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

export { app }