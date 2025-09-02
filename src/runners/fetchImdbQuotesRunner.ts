import { JobType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { getTabstackClient } from '@/lib/tabstack';
import { parseImdbQuotes } from '@/lib/imdbQuoteParser';
import { prisma } from '@/lib/db';

interface FetchImdbQuotesPayload {
  movieId: string;
  imdbId: string;
}

interface FetchImdbQuotesResult {
  quotesImported: number;
  charactersCreated: number;
  actorsCreated: number;
  quotesUpdated: number;
  quotesSkipped: number;
}

export const jobType = JobType.FETCH_IMDB_QUOTES;

export async function run(payload: FetchImdbQuotesPayload): Promise<FetchImdbQuotesResult> {
  const { movieId, imdbId } = payload;
  
  logger.info(`Starting IMDb quote fetch for movie ${movieId} (IMDb: ${imdbId})`);

  const result: FetchImdbQuotesResult = {
    quotesImported: 0,
    charactersCreated: 0,
    actorsCreated: 0,
    quotesUpdated: 0,
    quotesSkipped: 0
  };

  try {
    // Verify the movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      throw new Error(`Movie with ID ${movieId} not found`);
    }

    // Fetch quotes from IMDb via Tabstack
    const tabstackClient = getTabstackClient();
    const rawQuotes = await tabstackClient.fetchImdbQuotes(imdbId);

    if (!rawQuotes) {
      logger.info(`No quotes found for IMDb ID ${imdbId}`);
      return result;
    }

    // Parse the raw quotes
    const parsedQuotes = parseImdbQuotes(rawQuotes);

    if (parsedQuotes.length === 0) {
      logger.info(`No valid quotes parsed for IMDb ID ${imdbId}`);
      return result;
    }

    // Process each quote
    for (const parsedQuote of parsedQuotes) {
      try {
        // Check if quote already exists
        const existingQuote = await prisma.quote.findUnique({
          where: { imdbQuoteId: parsedQuote.imdbQuoteId }
        });

        if (existingQuote) {
          // Quote already exists with IMDb ID
          logger.debug(`Quote ${parsedQuote.imdbQuoteId} already exists, skipping`);
          result.quotesSkipped++;
          continue;
        }

        // Check for manual quotes (without IMDb ID) with similar content
        // This is a simplified check - could be made more sophisticated
        const firstLineContent = parsedQuote.lines[0]?.content;
        if (firstLineContent) {
          const manualQuote = await prisma.quote.findFirst({
            where: {
              movieId,
              imdbQuoteId: null,
              lines: {
                some: {
                  content: {
                    contains: firstLineContent.substring(0, 50) // Check first 50 chars
                  }
                }
              }
            }
          });

          if (manualQuote) {
            logger.info(`Found similar manual quote, updating with IMDb ID ${parsedQuote.imdbQuoteId}`);
            
            // Update the manual quote with the IMDb ID
            await prisma.quote.update({
              where: { id: manualQuote.id },
              data: { imdbQuoteId: parsedQuote.imdbQuoteId }
            });
            
            result.quotesUpdated++;
            continue;
          }
        }

        // Create new quote with lines
        await prisma.$transaction(async (tx) => {
          // Maps to track characters and actors
          const characterMap = new Map<string, string>();
          const actorMap = new Map<string, string>();
          
          // First pass: ensure all actors and characters exist
          for (const line of parsedQuote.lines) {
            // Handle actor if we have an IMDb ID
            if (line.actorImdbId && line.characterName) {
              // Check if actor exists by IMDb ID
              let actor = await tx.actor.findUnique({
                where: { imdbId: line.actorImdbId }
              });

              if (!actor) {
                // Actor doesn't exist, we'll need to create one
                // For now, we'll use the character name as a placeholder
                // In a real scenario, we might want to fetch actor details from IMDb
                actor = await tx.actor.create({
                  data: {
                    name: line.characterName, // Placeholder - should be actor's real name
                    imdbId: line.actorImdbId
                  }
                });
                result.actorsCreated++;
                logger.info(`Created actor with IMDb ID: ${line.actorImdbId}`);
              }

              actorMap.set(line.actorImdbId, actor.id);
            }

            // Handle character
            if (line.characterName) {
              // Check if character exists
              let character = await tx.character.findFirst({
                where: { name: line.characterName }
              });

              if (!character) {
                // Create new character
                character = await tx.character.create({
                  data: { name: line.characterName }
                });
                result.charactersCreated++;
                logger.info(`Created character: ${line.characterName}`);
              }

              characterMap.set(line.characterName, character.id);

              // Create character portrayal if we have both actor and character
              if (line.actorImdbId && actorMap.has(line.actorImdbId)) {
                const actorId = actorMap.get(line.actorImdbId)!;
                
                // Check if portrayal already exists
                const existingPortrayal = await tx.characterPortrayal.findFirst({
                  where: {
                    characterId: character.id,
                    actorId: actorId,
                    movieId: movieId
                  }
                });

                if (!existingPortrayal) {
                  await tx.characterPortrayal.create({
                    data: {
                      characterId: character.id,
                      actorId: actorId,
                      movieId: movieId
                    }
                  });
                  logger.info(`Created character portrayal: ${line.characterName} by actor ${line.actorImdbId}`);
                }
              }
            }
          }

          // Create the quote with all lines
          await tx.quote.create({
            data: {
              movieId,
              imdbQuoteId: parsedQuote.imdbQuoteId,
              lines: {
                create: parsedQuote.lines.map(line => ({
                  content: line.content,
                  lineType: line.lineType,
                  orderIndex: line.orderIndex,
                  characterId: line.characterName ? characterMap.get(line.characterName) : undefined
                }))
              }
            }
          });

          result.quotesImported++;
        });

        logger.info(`Imported quote ${parsedQuote.imdbQuoteId} with ${parsedQuote.lines.length} lines`);

      } catch (error) {
        logger.error(`Failed to import quote ${parsedQuote.imdbQuoteId}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logger.info(`IMDb quote import completed for movie ${movieId}`, result);
    return result;

  } catch (error) {
    logger.error(`Failed to fetch IMDb quotes for movie ${movieId}`, {
      error: error instanceof Error ? error.message : String(error),
      movieId,
      imdbId
    });
    throw error;
  }
}