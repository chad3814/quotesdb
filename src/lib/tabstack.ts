import { logger } from '@/lib/logger';

interface DialogueLine {
  character: string | null;
  actorLink: string | null;
  timeStamp: string | null;
  quoteText: string;
}

interface TabstackQuote {
  id: string;
  dialogueLines: DialogueLine[];
}

interface TabstackResponse {
  movie: string;
  quotes: TabstackQuote[];
}

export interface TabstackQuoteSchema {
  movie: string;
  quotes: TabstackQuote[];
}

export class TabstackClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tabstack.ai';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Tabstack API key is required');
    }
    this.apiKey = apiKey;
  }

  async fetchImdbQuotes(imdbId: string): Promise<TabstackQuoteSchema | null> {
    const url = `https://www.imdb.com/title/${imdbId}/quotes/`;
    
    logger.info(`Fetching IMDb quotes for ${imdbId}`, { imdbId, url });

    try {
      const response = await fetch(`${this.baseUrl}/json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          json_schema: {
            type: 'object',
            description: 'Schema for IMDb movie quotes page',
            properties: {
              movie: {
                type: 'string',
                description: 'Name of the movie these quotes relate to'
              },
              quotes: {
                type: 'array',
                description: 'List of quotes from the movie',
                maxItems: 25,
                items: {
                  type: 'object',
                  description: 'A single quote, which may contain multiple dialogue lines',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Unique identifier for the quote item'
                    },
                    dialogueLines: {
                      type: 'array',
                      description: 'A single line of the quote, typically spoken by a character',
                      maxItems: 50,
                      items: {
                        type: 'object',
                        properties: {
                          character: {
                            type: ['string', 'null'],
                            description: 'The name of the character who speaks the quote or null if not specified'
                          },
                          actorLink: {
                            type: ['string', 'null'],
                            description: 'Link to the actor\'s IMDb page or null if not specified'
                          },
                          timeStamp: {
                            type: ['string', 'null'],
                            description: 'Timestamp in the movie when the quote occurs or null if not specified'
                          },
                          quoteText: {
                            type: 'string',
                            description: 'The textual content of the quote line'
                          }
                        },
                        required: [
                          'character',
                          'actorLink',
                          'timeStamp',
                          'quoteText'
                        ],
                        additionalProperties: false
                      }
                    }
                  },
                  required: [
                    'id',
                    'dialogueLines'
                  ],
                  additionalProperties: false
                }
              }
            },
            required: [
              'movie',
              'quotes'
            ],
            additionalProperties: false
          }
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          logger.info(`No quotes page found for IMDb ID ${imdbId}`);
          return null;
        }
        const errorText = await response.text();
        logger.error('Tabstack API error details', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          imdbId
        });
        throw new Error(`Tabstack API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: TabstackResponse = await response.json();
      
      if (!result.quotes || result.quotes.length === 0) {
        logger.info(`No quotes found for IMDb ID ${imdbId}`);
        return null;
      }

      logger.info(`Found ${result.quotes.length} quotes for IMDb ID ${imdbId}`);
      return result;

    } catch (error) {
      logger.error('Failed to fetch IMDb quotes', {
        error: error instanceof Error ? error.message : String(error),
        imdbId
      });
      throw error;
    }
  }
}

// Singleton instance
let tabstackClient: TabstackClient | null = null;

export function getTabstackClient(): TabstackClient {
  if (!tabstackClient) {
    const apiKey = process.env.TABSTACK_TOKEN;
    if (!apiKey) {
      throw new Error('TABSTACK_TOKEN environment variable is not set');
    }
    tabstackClient = new TabstackClient(apiKey);
  }
  return tabstackClient;
}