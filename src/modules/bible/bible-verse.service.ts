// src/modules/bible/bible-verse.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BibleApiService, BibleVerseResponse, BibleSearchResult } from './bible-api.service';
import { BibleVerse } from '@prisma/client';
import { BIBLE_VERSES_COUNTS } from './bible-verse-counts'; // IMPORT THE NEW FILE

@Injectable()
export class BibleVerseService {
  private readonly logger = new Logger(BibleVerseService.name);

  // Keep only chapter counts (number of chapters per book) - this is different from verse counts
  private readonly chapterCounts: { [key: string]: number } = {
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
   * Get the expected number of verses for a specific chapter
   * NOW USING THE COMPLETE BIBLE_VERSES_COUNTS
   */
  private getExpectedVerseCount(book: string, chapter: number): number {
    // Get the array of verse counts for this book
    const bookCounts = BIBLE_VERSES_COUNTS[book];
    
    if (!bookCounts) {
      this.logger.warn(`No verse count data for book: ${book}, using fallback 150`);
      return 150; // Fallback
    }
    
    // Arrays are 0-indexed, chapters are 1-indexed
    const index = chapter - 1;
    
    if (index >= bookCounts.length) {
      this.logger.warn(`Chapter ${chapter} exceeds known chapters for ${book} (max: ${bookCounts.length})`);
      return 150;
    }
    
    const expectedCount = bookCounts[index];
    this.logger.debug(`Expected verses for ${book} ${chapter}: ${expectedCount}`);
    
    return expectedCount;
  }

  /**
   * Get a chapter, fetching ALL verses from API if not in database
   */
  async getChapter(book: string, chapter: number, translation: string = 'kjv') {
    this.logger.log(`========== GET CHAPTER START ==========`);
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

    // Get expected verse count for this specific chapter
    const expectedLength = this.getExpectedVerseCount(book, chapter);
    this.logger.log(`Expected verses for ${book} ${chapter}: ${expectedLength}`);

    // If we have all verses, return them
    if (verses.length === expectedLength) {
      this.logger.log(`✅ Found complete chapter in database`);
      this.logger.log(`========== GET CHAPTER END ==========`);
      return verses;
    }

    this.logger.log(`⚠️ Database incomplete. Fetching from API using Parameterized API...`);

    // Fetch complete chapter using Parameterized API
    try {
      const bookId = this.bibleApi.getBookId(book);
      this.logger.log(`Book ID: ${bookId}`);
      
      const apiVerses = await this.bibleApi.getCompleteChapter(translation, bookId, chapter);
      
      this.logger.log(`API returned ${apiVerses.length} verses`);
      
      if (apiVerses.length > 0) {
        // Log verse range
        const verseNumbers = apiVerses.map(v => v.verse).sort((a, b) => a - b);
        this.logger.log(`Verse numbers from API: ${verseNumbers[0]} to ${verseNumbers[verseNumbers.length-1]}`);
        this.logger.log(`Total verses from API: ${verseNumbers.length}`);
      }
      
      // Get or create version
      const version = await this.getOrCreateVersion(translation);
      
      // Save ALL verses to database
      let savedCount = 0;
      let updatedCount = 0;
      
      for (const v of apiVerses) {
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
              bibleId: `${bookId}_${chapter}_${v.verse}`,
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
        } else {
          // Optionally update existing verse text if it changed
          if (existing.text !== v.text) {
            await this.prisma.bibleVerse.update({
              where: { id: existing.id },
              data: { text: v.text }
            });
            updatedCount++;
          }
        }
      }
      
      this.logger.log(`Saved ${savedCount} new verses, updated ${updatedCount} existing verses`);
      
      // Get ALL verses from database after save
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
      
      this.logger.log(`After fetch, found ${verses.length}/${expectedLength} verses in database`);
      
      // Final verification
      if (verses.length === expectedLength) {
        this.logger.log(`✅ Successfully fetched complete chapter`);
      } else {
        this.logger.warn(`⚠️ Chapter still incomplete: have ${verses.length}, expected ${expectedLength}`);
        
        // Log missing verses
        const presentVerses = new Set(verses.map(v => v.verse));
        const missingVerses: number[] = []; // Add type annotation
        for (let i = 1; i <= expectedLength; i++) {
          if (!presentVerses.has(i)) {
            missingVerses.push(i);
          }
        }
        if (missingVerses.length > 0) {
          this.logger.warn(`Missing verses: ${missingVerses.join(', ')}`);
        }
      }
      
      this.logger.log(`========== GET CHAPTER END ==========`);
      return verses;
      
    } catch (error) {
      this.logger.error(`Parameterized API failed: ${error.message}`);
      this.logger.log(`Falling back to range fetch method...`);
      
      // Fall back to range fetch method
      return this.getChapterRangeFallback(book, chapter, translation, expectedLength);
    }
  }

  /**
   * Fallback method using range fetch
   */
  private async getChapterRangeFallback(book: string, chapter: number, translation: string = 'kjv', expectedLength?: number) {
    this.logger.log(`Using fallback range fetch for ${book} ${chapter}`);
    
    const expected = expectedLength || this.getExpectedVerseCount(book, chapter);
    
    try {
      // Try to get the chapter range
      const rangeReference = `${book} ${chapter}:1-${expected}`;
      this.logger.log(`Fetching range: ${rangeReference}`);
      
      const passageData = await this.bibleApi.getPassage(rangeReference, translation);
      
      if (passageData.verses && passageData.verses.length > 0) {
        this.logger.log(`Range API returned ${passageData.verses.length} verses`);
        
        const version = await this.getOrCreateVersion(translation);
        
        // Save verses
        for (const v of passageData.verses) {
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
          }
        }
        
        // Get all verses
        const verses = await this.prisma.bibleVerse.findMany({
          where: {
            book: { equals: book },
            chapter,
            version: { code: translation },
          },
          orderBy: { verse: 'asc' },
          include: { version: true },
        });
        
        this.logger.log(`Fallback complete: found ${verses.length} verses`);
        return verses;
      }
    } catch (error) {
      this.logger.error(`Fallback range fetch failed: ${error.message}`);
    }
    
    // Ultimate fallback - return whatever we have
    const verses = await this.prisma.bibleVerse.findMany({
      where: {
        book: { equals: book },
        chapter,
        version: { code: translation },
      },
      orderBy: { verse: 'asc' },
      include: { version: true },
    });
    
    this.logger.log(`Returning ${verses.length} verses from database (may be incomplete)`);
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

  /**
   * Verify a chapter has all verses
   */
  async verifyChapterCompleteness(book: string, chapter: number, translation: string = 'kjv'): Promise<{
    isComplete: boolean;
    expected: number;
    actual: number;
    missingVerses: number[];
  }> {
    const verses = await this.prisma.bibleVerse.findMany({
      where: {
        book: { equals: book },
        chapter,
        version: { code: translation },
      },
      orderBy: { verse: 'asc' },
    });
    
    const expected = this.getExpectedVerseCount(book, chapter);
    const presentVerses = new Set(verses.map(v => v.verse));
    
    const missingVerses: number[] = []; // Add type annotation
    for (let i = 1; i <= expected; i++) {
      if (!presentVerses.has(i)) {
        missingVerses.push(i);
      }
    }
    
    return {
      isComplete: missingVerses.length === 0,
      expected,
      actual: verses.length,
      missingVerses,
    };
  }
}