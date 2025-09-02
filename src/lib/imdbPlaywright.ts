import { chromium, Browser, Page } from 'playwright';
import { logger } from '@/lib/logger';

interface PlaywrightQuoteLine {
  character: string | null;
  actorLink: string | null;
  quoteText: string;
}

interface PlaywrightQuote {
  id: string;
  dialogueLines: PlaywrightQuoteLine[];
}

export interface PlaywrightQuoteData {
  movie: string;
  quotes: PlaywrightQuote[];
}

export class IMDbPlaywrightClient {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    if (!this.page) {
      this.page = await this.browser.newPage();
      // Set a realistic user agent
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
    }
  }

  async close() {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async fetchAllQuotes(imdbId: string): Promise<PlaywrightQuoteData | null> {
    try {
      await this.initialize();
      if (!this.page) throw new Error('Page not initialized');

      const url = `https://www.imdb.com/title/${imdbId}/quotes/`;
      logger.info(`Navigating to IMDb quotes page: ${url}`);
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Check if quotes page exists
      const pageNotFound = await this.page.$('text="Page not found"');
      if (pageNotFound) {
        logger.info(`No quotes page found for IMDb ID ${imdbId}`);
        return null;
      }

      // Get the movie title
      const movieTitle = await this.page.evaluate(() => {
        const titleElement = document.querySelector('h3[itemprop="name"] a');
        return titleElement?.textContent?.trim() || 'Unknown Movie';
      });

      logger.info(`Found quotes page for: ${movieTitle}`);

      // Check for "Load More" button and click it to load all quotes
      let loadMoreClicks = 0;
      while (true) {
        const loadMoreButton = await this.page.$('span.chained-see-more-button button');
        if (!loadMoreButton) {
          logger.info(`No more quotes to load after ${loadMoreClicks} clicks`);
          break;
        }

        const isVisible = await loadMoreButton.isVisible();
        if (!isVisible) {
          logger.info(`Load more button not visible after ${loadMoreClicks} clicks`);
          break;
        }

        try {
          await loadMoreButton.click();
          loadMoreClicks++;
          logger.info(`Clicked load more button (click #${loadMoreClicks})`);
          
          // Wait for new content to load
          await this.page.waitForTimeout(1500);
          
          // Safety limit to prevent infinite loops
          if (loadMoreClicks > 50) {
            logger.warn('Reached maximum load more clicks (50)');
            break;
          }
        } catch (error) {
          logger.warn(`Failed to click load more button: ${error}`);
          break;
        }
      }

      // Extract all quotes using the correct selector
      const quotes = await this.page.evaluate(() => {
        const quoteElements = document.querySelectorAll('div[data-testid="item-id"] ul');
        const quotesData: PlaywrightQuote[] = [];

        quoteElements.forEach((quoteEl, index) => {
          const lines: PlaywrightQuoteLine[] = [];
          
          // Find all list items (dialogue lines) within this quote
          const lineElements = quoteEl.querySelectorAll('li');
          
          lineElements.forEach(lineEl => {
            // Clone the element to work with
            const workingEl = lineEl.cloneNode(true) as HTMLElement;
            
            // Extract character name and actor link
            // Character can be in either an anchor tag (with actor link) or a strong tag (without actor link)
            const characterLink = workingEl.querySelector('a[href*="/name/"]');
            const characterStrong = workingEl.querySelector('strong');
            
            let character: string | null = null;
            let actorLink: string | null = null;
            
            if (characterLink) {
              // Character with actor link
              character = characterLink.textContent?.trim() || null;
              actorLink = (characterLink as HTMLAnchorElement).pathname;
              // Remove the character element from our working copy
              characterLink.remove();
            } else if (characterStrong) {
              // Character without actor link (just in strong tag)
              character = characterStrong.textContent?.trim() || null;
              actorLink = null;
              // Remove the character element from our working copy
              characterStrong.remove();
            }
            
            // Get the remaining text content (after removing character name)
            let fullText = workingEl.textContent?.trim() || '';
            
            // Remove leading colon if present (from "Character: dialogue" format)
            if (fullText.startsWith(':')) {
              fullText = fullText.substring(1).trim();
            }
            
            // Check if this entire line is a stage direction (wrapped in brackets)
            const isFullStageDirection = fullText.startsWith('[') && fullText.endsWith(']');
            
            // Handle inline stage directions at the start of dialogue
            let stageDirection: string | null = null;
            if (!isFullStageDirection && character) {
              // Check for stage direction at the beginning like "[addressing someone] dialogue"
              const inlineStageMatch = fullText.match(/^\[([^\]]+)\]\s*(.+)$/);
              if (inlineStageMatch) {
                // Save the stage direction to add before the dialogue
                stageDirection = `[${inlineStageMatch[1]}]`;
                // Continue with the dialogue part
                fullText = inlineStageMatch[2];
              }
            }
            
            // Add the stage direction first if present
            if (stageDirection) {
              lines.push({
                character: null,
                actorLink: null,
                quoteText: stageDirection
              });
            }
            
            // Then add the dialogue line if it has content
            if (fullText) {
              lines.push({
                character: isFullStageDirection ? null : character,
                actorLink: isFullStageDirection ? null : actorLink,
                quoteText: fullText
              });
            }
          });

          if (lines.length > 0) {
            quotesData.push({
              id: `imdb_quote_${index}`,
              dialogueLines: lines
            });
          }
        });

        return quotesData;
      });

      logger.info(`Successfully extracted ${quotes.length} quotes from IMDb`);

      return {
        movie: movieTitle,
        quotes
      };

    } catch (error) {
      logger.error('Failed to fetch IMDb quotes with Playwright', {
        error: error instanceof Error ? error.message : String(error),
        imdbId
      });
      throw error;
    }
  }
}

// Singleton instance
let playwrightClient: IMDbPlaywrightClient | null = null;

export function getIMDbPlaywrightClient(): IMDbPlaywrightClient {
  if (!playwrightClient) {
    playwrightClient = new IMDbPlaywrightClient();
  }
  return playwrightClient;
}

// Clean up on process exit
process.on('exit', async () => {
  if (playwrightClient) {
    await playwrightClient.close();
  }
});

process.on('SIGINT', async () => {
  if (playwrightClient) {
    await playwrightClient.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (playwrightClient) {
    await playwrightClient.close();
  }
  process.exit(0);
});