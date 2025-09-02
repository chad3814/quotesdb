#!/usr/bin/env node
import 'dotenv/config';
import { JobType } from '@prisma/client';
import { logger } from '@/lib/logger';
import * as fetchTabstackHandler from './fetchImdbQuotesRunner';
import * as fetchPlaywrightHandler from './fetchImdbQuotesPlaywrightRunner';

// Parse command line arguments
const args = process.argv.slice(2);
const method = args[0] || 'tabstack'; // Default to tabstack
const isPlaywright = method.toLowerCase() === 'playwright';

const API_URL = process.env.COORDINATOR_URL || 'http://localhost:3001';
const RUNNER_ID = `${isPlaywright ? 'playwright' : 'tabstack'}-imdb-runner-${process.pid}`;
const POLL_INTERVAL = 5000; // 5 seconds

logger.info(`Starting IMDb runner in ${isPlaywright ? 'Playwright' : 'Tabstack'} mode`, { 
  runnerId: RUNNER_ID,
  method: isPlaywright ? 'playwright' : 'tabstack'
});

async function claimJob() {
  try {
    const response = await fetch(`${API_URL}/jobs/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runner_id: RUNNER_ID,
        types: [JobType.FETCH_IMDB_QUOTES]
      })
    });

    if (response.status === 204) {
      return null; // No job available
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to claim job: ${response.status} - ${errorText}`);
    }

    return response.json();
  } catch (error) {
    logger.error('Failed to claim job', { 
      error: error instanceof Error ? error.message : String(error),
      apiUrl: `${API_URL}/jobs/claim`,
      runnerId: RUNNER_ID
    });
    return null;
  }
}

async function completeJob(jobId: string, result: any) {
  try {
    const response = await fetch(`${API_URL}/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runner_id: RUNNER_ID,
        success: true,
        result
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to complete job: ${response.status}`);
    }
  } catch (error) {
    logger.error('Failed to complete job', { error, jobId });
  }
}

async function failJob(jobId: string, error: string) {
  try {
    const response = await fetch(`${API_URL}/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runner_id: RUNNER_ID,
        success: false,
        error
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fail job: ${response.status}`);
    }
  } catch (error) {
    logger.error('Failed to fail job', { error, jobId });
  }
}

async function processJob(job: any) {
  const { id: jobId, type: jobType, arguments: jobArgs } = job;
  
  logger.info(`Processing job ${jobId} using ${isPlaywright ? 'Playwright' : 'Tabstack'}`, {
    jobId,
    jobType,
    method: isPlaywright ? 'playwright' : 'tabstack'
  });
  
  try {
    let result;
    
    switch (jobType) {
      case JobType.FETCH_IMDB_QUOTES:
        // Use the appropriate handler based on the mode
        if (isPlaywright) {
          result = await fetchPlaywrightHandler.run(jobArgs);
        } else {
          result = await fetchTabstackHandler.run(jobArgs);
        }
        break;
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
    
    await completeJob(jobId, result);
    logger.info(`Completed job ${jobId}`, { result, method: isPlaywright ? 'playwright' : 'tabstack' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await failJob(jobId, errorMessage);
    logger.error(`Failed job ${jobId}`, { error: errorMessage });
  }
}

async function runWorker() {
  logger.info(`IMDb runner started`, { 
    runnerId: RUNNER_ID,
    method: isPlaywright ? 'playwright' : 'tabstack',
    description: isPlaywright 
      ? 'Using Playwright browser automation (fetches all quotes)'
      : 'Using Tabstack API (fetches first 25 quotes)'
  });
  
  let isShuttingDown = false;
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    isShuttingDown = true;
  });
  
  process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    isShuttingDown = true;
  });
  
  while (!isShuttingDown) {
    try {
      const job = await claimJob();
      
      if (job) {
        await processJob(job);
      } else {
        // No job available, wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (error) {
      logger.error('Error in worker loop', { error });
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
  
  logger.info('IMDb runner shut down gracefully');
  process.exit(0);
}

// Show usage if help is requested
if (args.includes('--help') || args.includes('-h')) {
  console.log('IMDb Quote Runner - Fetches quotes from IMDb using either Tabstack API or Playwright');
  console.log('\nUsage: tsx unifiedImdbRunner.ts [method]');
  console.log('\nMethods:');
  console.log('  tabstack    - Use Tabstack API (default, fast, limited to 25 quotes)');
  console.log('  playwright  - Use Playwright browser automation (slower, fetches all quotes)');
  console.log('\nExamples:');
  console.log('  tsx unifiedImdbRunner.ts');
  console.log('  tsx unifiedImdbRunner.ts tabstack');
  console.log('  tsx unifiedImdbRunner.ts playwright');
  process.exit(0);
}

// Validate method argument
if (method !== 'tabstack' && method !== 'playwright') {
  console.error(`Error: Invalid method "${method}". Must be either "tabstack" or "playwright".`);
  console.log('Run with --help for usage information.');
  process.exit(1);
}

// Start the worker
runWorker().catch(error => {
  logger.error('Fatal error in IMDb runner', { error });
  process.exit(1);
});