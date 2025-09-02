import { LineType } from '@prisma/client';
import { logger } from '@/lib/logger';
import { TabstackQuoteSchema } from '@/lib/tabstack';

export interface ParsedQuoteLine {
  characterName?: string;
  content: string;
  lineType: LineType;
  orderIndex: number;
  actorImdbId?: string;
}

export interface ParsedQuote {
  imdbQuoteId: string;
  lines: ParsedQuoteLine[];
}

export function parseImdbQuotes(rawQuotes: TabstackQuoteSchema): ParsedQuote[] {
  const parsedQuotes: ParsedQuote[] = [];

  if (!rawQuotes?.quotes || !Array.isArray(rawQuotes.quotes)) {
    logger.warn('Invalid quote data structure');
    return parsedQuotes;
  }

  logger.info(`Processing ${rawQuotes.quotes.length} quotes from ${rawQuotes.movie}`);

  // Each quote has an id and dialogueLines array
  for (const quote of rawQuotes.quotes) {
    if (!quote.dialogueLines || !Array.isArray(quote.dialogueLines) || quote.dialogueLines.length === 0) {
      continue;
    }

    try {
      const parsedLines: ParsedQuoteLine[] = [];
      
      // Process each dialogue line in the quote
      for (const line of quote.dialogueLines) {
        if (!line.quoteText) {
          continue;
        }

        let content = line.quoteText;
        
        // Remove timestamp from the beginning if present
        if (line.timeStamp) {
          const timestampPattern = `[${line.timeStamp}] `;
          if (content.startsWith(timestampPattern)) {
            content = content.substring(timestampPattern.length);
          }
        }

        content = cleanQuoteText(content);
        if (!content) {
          continue;
        }

        // Extract actor IMDb ID from actorLink if present
        let actorImdbId: string | undefined;
        if (line.actorLink) {
          const match = line.actorLink.match(/nm\d+/);
          if (match) {
            actorImdbId = match[0];
          }
        }

        // Check for narration markers
        let isNarration = false;
        if (content.startsWith('[narration] ') || content.startsWith('[narrating] ')) {
          isNarration = true;
          content = content.replace(/^\[(narration|narrating)\] /, '');
        }

        // Check if entire line is stage direction
        const isFullStageDirection = isStageDirection(content);
        
        // Check for inline stage direction at the start (but not the entire line)
        let inlineStageDirection: string | undefined;
        if (!isFullStageDirection && content.startsWith('[') && content.includes('] ')) {
          const endBracketIndex = content.indexOf('] ');
          if (endBracketIndex > 0) {
            inlineStageDirection = content.substring(1, endBracketIndex);
            content = content.substring(endBracketIndex + 2);
          }
        }

        // Add inline stage direction as separate line if present
        if (inlineStageDirection) {
          parsedLines.push({
            content: inlineStageDirection,
            lineType: LineType.STAGE_DIRECTION,
            orderIndex: parsedLines.length
          });
        }

        // Determine line type and add the main content
        let lineType: LineType;
        let characterName: string | undefined;

        if (isFullStageDirection) {
          lineType = LineType.STAGE_DIRECTION;
          content = content.slice(1, -1).trim(); // Remove brackets
        } else if (isNarration) {
          lineType = LineType.NARRATION;
        } else if (line.character) {
          lineType = LineType.DIALOGUE;
          characterName = normalizeCharacterName(line.character);
        } else {
          lineType = LineType.NARRATION;
        }

        parsedLines.push({
          characterName: lineType === LineType.DIALOGUE ? characterName : undefined,
          content,
          lineType,
          orderIndex: parsedLines.length,
          actorImdbId: lineType === LineType.DIALOGUE ? actorImdbId : undefined
        });
      }

      if (parsedLines.length > 0) {
        parsedQuotes.push({
          imdbQuoteId: quote.id,
          lines: parsedLines
        });
      }
    } catch (error) {
      logger.error('Error parsing quote', {
        error: error instanceof Error ? error.message : String(error),
        quoteId: quote.id
      });
    }
  }

  logger.info(`Successfully parsed ${parsedQuotes.length} quotes`);
  return parsedQuotes;
}


function isStageDirection(text: string): boolean {
  // Check if text is wrapped in brackets or parentheses
  const trimmed = text.trim();
  return (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
         (trimmed.startsWith('(') && trimmed.endsWith(')'));
}

function normalizeCharacterName(name: string): string {
  // Remove any extra whitespace and normalize the character name
  return name
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.) /, ''); // Remove common titles if needed
}

function cleanQuoteText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes if present
    .replace(/\\n/g, '\n') // Convert escaped newlines
    .replace(/\\t/g, ' ')  // Convert tabs to spaces
    .replace(/\\/g, '');   // Remove escape characters
}