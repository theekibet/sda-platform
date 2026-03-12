// src/modules/bible/bible-verse.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BibleApiService, BibleVerseResponse, BibleSearchResult } from './bible-api.service';
import { BibleVerse } from '@prisma/client';

@Injectable()
export class BibleVerseService {
  private readonly logger = new Logger(BibleVerseService.name);

  // Chapter length mapping for all Bible books
  private readonly chapterLengths: { [key: string]: number } = {
    'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
    'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
    '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36,
    'Ezra': 10, 'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150,
    'Proverbs': 31, 'Ecclesiastes': 12, 'Song of Solomon': 8, 'Isaiah': 66,
    'Jeremiah': 52, 'Lamentations': 5, 'Ezekiel': 48, 'Daniel': 12,
    'Hosea': 14, 'Joel': 3, 'Amos': 9, 'Obadiah': 1, 'Jonah': 4,
    'Micah': 7, 'Nahum': 3, 'Habakkuk': 3, 'Zephaniah': 3, 'Haggai': 2,
    'Zechariah': 14, 'Malachi': 4,
    'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
    'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6,
    'Ephesians': 6, 'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5,
    '2 Thessalonians': 3, '1 Timothy': 6, '2 Timothy': 4, 'Titus': 3,
    'Philemon': 1, 'Hebrews': 13, 'James': 5, '1 Peter': 5, '2 Peter': 3,
    '1 John': 5, '2 John': 1, '3 John': 1, 'Jude': 1, 'Revelation': 22
  };

  constructor(
    private prisma: PrismaService,
    private bibleApi: BibleApiService,
  ) {}

  /**
   * Get or create a verse in the database
   * This prevents duplicate API calls for the same verse
   */
  async getOrCreateVerse(
    reference: string,
    translation: string = 'kjv'
  ) {
    this.logger.log(`getOrCreateVerse called with: ${reference} (${translation})`);
    
    // Parse the reference to extract components
    const parsed = this.parseReference(reference);
    
    if (!parsed) {
      throw new Error(`Invalid verse reference: ${reference}`);
    }
    
    const { book, chapter, verse, verseEnd } = parsed;
    
    // Check if we already have this verse in our database
    const existingVerse = await this.prisma.bibleVerse.findFirst({
      where: {
        book: { equals: book },
        chapter,
        verse,
        version: {
          code: translation,
        },
      },
      include: {
        version: true,
      },
    });
    
    if (existingVerse) {
      this.logger.debug(`Verse found in database: ${reference}`);
      return existingVerse;
    }
    
    // Fetch from API if not in database
    this.logger.log(`Fetching verse from API: ${reference}`);
    let verseData;
    
    try {
      verseData = verseEnd
        ? await this.bibleApi.getPassage(reference, translation)
        : await this.bibleApi.getVerse(reference, translation);
    } catch (error) {
      this.logger.error(`API fetch failed: ${error.message}`);
      throw error;
    }
    
    // Get or create the Bible version
    const version = await this.getOrCreateVersion(translation);
    
    // Check if verseData is a passage (has verses array) or single verse
    if (verseEnd || (verseData as BibleSearchResult).verses) {
      // Handle multiple verses (passage)
      const passageData = verseData as BibleSearchResult;
      const savedVerses: any[] = [];
      
      for (const v of passageData.verses) {
        // Check if verse already exists to avoid duplicates
        const existing = await this.prisma.bibleVerse.findFirst({
          where: {
            book: { equals: v.book },
            chapter: v.chapter,
            verse: v.verse,
            versionId: version.id,
          },
        });
        
        if (!existing) {
          const saved = await this.prisma.bibleVerse.create({
            data: {
              bibleId: `${v.book}_${v.chapter}_${v.verse}`,
              versionId: version.id,
              reference: v.reference,
              book: v.book,
              chapter: v.chapter,
              verse: v.verse,
              text: v.text,
              isRange: false,
            },
          });
          savedVerses.push(saved);
        } else {
          savedVerses.push(existing);
        }
      }
      return savedVerses;
    } else {
      // Handle single verse
      const singleVerse = verseData as BibleVerseResponse;
      return this.prisma.bibleVerse.create({
        data: {
          bibleId: `${singleVerse.book}_${singleVerse.chapter}_${singleVerse.verse}`,
          versionId: version.id,
          reference: singleVerse.reference,
          book: singleVerse.book,
          chapter: singleVerse.chapter,
          verse: singleVerse.verse,
          text: singleVerse.text,
          isRange: false,
        },
        include: {
          version: true,
        },
      });
    }
  }

  /**
   * Get or create a Bible version in the database
   */
  private async getOrCreateVersion(code: string) {
    const translations = this.bibleApi.getTranslations();
    const translation = translations.find(t => t.code === code) || {
      code: 'kjv',
      name: 'King James Version',
    };
    
    return this.prisma.bibleVersion.upsert({
      where: { code: translation.code },
      update: {},
      create: {
        code: translation.code,
        name: translation.name,
        language: 'en',
      },
    });
  }

  /**
   * Parse a verse reference like "John 3:16" or "John 3:16-18"
   */
  private parseReference(reference: string): {
    book: string;
    chapter: number;
    verse: number;
    verseEnd?: number;
  } | null {
    // Simple regex to parse "Book Chapter:Verse" or "Book Chapter:Verse-Verse"
    const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
    
    if (!match) {
      return null;
    }
    
    const [, book, chapterStr, verseStr, verseEndStr] = match;
    
    return {
      book: book.trim(),
      chapter: parseInt(chapterStr),
      verse: parseInt(verseStr),
      verseEnd: verseEndStr ? parseInt(verseEndStr) : undefined,
    };
  }

  /**
   * Get a chapter, fetching ALL verses from API if not in database
   */
  async getChapter(book: string, chapter: number, translation: string = 'kjv') {
    this.logger.log(`Getting chapter ${book} ${chapter} (${translation})`);
    
    // First, try to get from database
    let verses = await this.prisma.bibleVerse.findMany({
      where: {
        book: { equals: book },
        chapter,
        version: {
          code: translation,
        },
      },
      orderBy: {
        verse: 'asc',
      },
      include: {
        version: true,
      },
    });

    this.logger.log(`Found ${verses.length} verses in database`);

    // Get expected chapter length for this book
    const expectedLength = this.chapterLengths[book] || 150;
    this.logger.log(`Expected length for ${book} ${chapter}: ${expectedLength} verses`);

    // Check if we have a complete chapter
    if (verses.length > 0) {
      const lastVerseInDb = Math.max(...verses.map(v => v.verse));
      const firstVerseInDb = Math.min(...verses.map(v => v.verse));
      
      this.logger.log(`Verses in DB: ${firstVerseInDb} to ${lastVerseInDb}`);
      
      // If we have the first and last verse of the chapter, assume complete
      if (firstVerseInDb === 1 && lastVerseInDb === expectedLength) {
        this.logger.log(`Found complete chapter (verses 1-${lastVerseInDb}), returning ${verses.length} cached verses`);
        return verses;
      }
      
      // If we don't have the complete chapter, fetch the rest
      this.logger.log(`Chapter incomplete: have verses ${firstVerseInDb}-${lastVerseInDb}, expected up to ${expectedLength}. Fetching from API...`);
    } else {
      this.logger.log(`No verses found in database for ${book} ${chapter}`);
    }

    // If we don't have the complete chapter, fetch the WHOLE chapter from API
    this.logger.log(`Fetching entire chapter ${book} ${chapter} from API...`);
    
    try {
      // Try to get the chapter range - use the exact chapter length
      const rangeReference = `${book} ${chapter}:1-${expectedLength}`;
      this.logger.log(`Fetching range: ${rangeReference}`);
      
      const passageData = await this.bibleApi.getPassage(rangeReference, translation);
      
      if (passageData.verses && passageData.verses.length > 0) {
        this.logger.log(`API returned ${passageData.verses.length} verses`);
        
        // Log the verse numbers to verify we got all of them
        const verseNumbers = passageData.verses.map(v => v.verse).sort((a, b) => a - b);
        this.logger.log(`Verse numbers from API: ${verseNumbers.join(', ')}`);
        
        // Get or create version
        const version = await this.getOrCreateVersion(translation);
        
        // Save ALL verses to database
        let savedCount = 0;
        for (const v of passageData.verses) {
          // Check if verse already exists
          const existing = await this.prisma.bibleVerse.findFirst({
            where: {
              book: { equals: v.book },
              chapter: v.chapter,
              verse: v.verse,
              versionId: version.id,
            },
          });
          
          if (!existing) {
            await this.prisma.bibleVerse.create({
              data: {
                bibleId: `${v.book}_${v.chapter}_${v.verse}`,
                versionId: version.id,
                reference: v.reference,
                book: v.book,
                chapter: v.chapter,
                verse: v.verse,
                text: v.text,
                isRange: false,
              },
            });
            savedCount++;
          }
        }
        
        this.logger.log(`Saved ${savedCount} new verses to database`);
        
        // Now get ALL verses from database
        verses = await this.prisma.bibleVerse.findMany({
          where: {
            book: { equals: book },
            chapter,
            version: {
              code: translation,
            },
          },
          orderBy: {
            verse: 'asc',
          },
          include: {
            version: true,
          },
        });
        
        this.logger.log(`After fetch, found ${verses.length} verses total`);
        return verses;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch chapter range: ${error.message}`);
    }
    
    // If range fetch fails, fetch verses individually up to the expected chapter length
    this.logger.log(`Trying fallback: fetching all verses individually up to ${expectedLength}`);
    
    const version = await this.getOrCreateVersion(translation);
    let lastFoundVerse = 0;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 5;
    
    // Add a delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Try up to expectedLength verses
    for (let i = 1; i <= expectedLength; i++) {
      try {
        // Add delay to avoid rate limiting
        await delay(500); // Wait 500ms between requests
        
        // Check if we already have this verse
        const existing = await this.prisma.bibleVerse.findFirst({
          where: {
            book: { equals: book },
            chapter,
            verse: i,
            versionId: version.id,
          },
        });
        
        if (!existing) {
          this.logger.log(`Fetching verse ${book} ${chapter}:${i}`);
          // Fetch this specific verse
          const verseData = await this.bibleApi.getVerse(`${book} ${chapter}:${i}`, translation);
          
          await this.prisma.bibleVerse.create({
            data: {
              bibleId: `${book}_${chapter}_${i}`,
              versionId: version.id,
              reference: `${book} ${chapter}:${i}`,
              book,
              chapter,
              verse: i,
              text: verseData.text,
              isRange: false,
            },
          });
          lastFoundVerse = i;
          consecutiveFailures = 0;
          this.logger.debug(`Successfully fetched verse ${i}`);
        } else {
          lastFoundVerse = i;
          consecutiveFailures = 0;
          this.logger.debug(`Verse ${i} already exists in database`);
        }
      } catch (e) {
        consecutiveFailures++;
        this.logger.warn(`Failed to fetch verse ${i} (failure ${consecutiveFailures}/${maxConsecutiveFailures}): ${e.message}`);
        
        // If we've had too many consecutive failures, assume end of chapter
        if (consecutiveFailures >= maxConsecutiveFailures) {
          this.logger.log(`Stopped after ${consecutiveFailures} consecutive failures at verse ${i}`);
          break;
        }
      }
    }
    
    this.logger.log(`Fetched up to verse ${lastFoundVerse}`);
    
    // Get all verses we have
    verses = await this.prisma.bibleVerse.findMany({
      where: {
        book: { equals: book },
        chapter,
        version: {
          code: translation,
        },
      },
      orderBy: {
        verse: 'asc',
      },
      include: {
        version: true,
      },
    });

    this.logger.log(`Returning ${verses.length} verses for ${book} ${chapter}`);
    return verses;
  }

  /**
   * Check if a verse has been used recently (for duplicate prevention)
   */
  async wasVerseUsedRecently(verseId: string, days: number = 30): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const recentUse = await this.prisma.sharedVerse.findFirst({
      where: {
        verseId,
        scheduledFor: { gte: cutoffDate },
        status: { in: ['published', 'scheduled'] },
      },
    });
    
    return !!recentUse;
  }

  /**
   * Get the next available date in the queue
   */
  async getNextAvailableDate(): Promise<Date> {
    const lastScheduled = await this.prisma.sharedVerse.findFirst({
      where: {
        scheduledFor: { not: null },
        status: { in: ['scheduled', 'published'] },
      },
      orderBy: {
        scheduledFor: 'desc',
      },
    });
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (!lastScheduled?.scheduledFor) {
      return tomorrow;
    }
    
    const nextDate = new Date(lastScheduled.scheduledFor);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0);
    
    return nextDate;
  }

  /**
   * Get queue position for a new submission
   */
  async getQueuePosition(): Promise<number> {
    const pendingCount = await this.prisma.sharedVerse.count({
      where: {
        status: 'pending',
      },
    });
    
    return pendingCount + 1;
  }
}