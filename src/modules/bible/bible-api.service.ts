// src/modules/bible/bible-api.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

export interface BibleVerseResponse {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
  translation: string;
  translationCode: string;
}

export interface BibleSearchResult {
  verses: BibleVerseResponse[];
  passage: string;
}

@Injectable()
export class BibleApiService {
  private readonly logger = new Logger(BibleApiService.name);
  private readonly baseUrl = 'https://bible-api.com';
  
  // List of popular verses to use as fallback for random endpoint
  private readonly popularVerses = [
    'John 3:16',
    'Psalm 23:1',
    'Romans 8:28',
    'Philippians 4:13',
    'Jeremiah 29:11',
    'Proverbs 3:5',
    'Isaiah 40:31',
    'Psalm 119:105',
    'Joshua 1:9',
    'Ephesians 2:8',
    'Matthew 11:28',
    '2 Corinthians 5:17',
    'Psalm 46:1',
    'Romans 12:2',
    'Galatians 5:22',
    'Philippians 4:6',
    '1 Peter 5:7',
    'Psalm 34:18',
    'Isaiah 41:10',
    'Romans 15:13'
  ];
  
  // Available translations (from documentation)
  private readonly availableTranslations = [
    { code: 'kjv', name: 'King James Version' },
    { code: 'esv', name: 'English Standard Version' },
    { code: 'web', name: 'World English Bible' },
    { code: 'bbe', name: 'Bible in Basic English' },
    { code: 'asv', name: 'American Standard Version' },
    { code: 'ylt', name: "Young's Literal Translation" },
    { code: 'darby', name: 'Darby Translation' },
  ];

  /**
   * Fetch a single verse by reference
   * Example: getVerse('John 3:16', 'kjv')
   */
  async getVerse(reference: string, translation: string = 'kjv'): Promise<BibleVerseResponse> {
    try {
      // Decode the reference first (in case it's already encoded)
      const cleanReference = decodeURIComponent(reference);
      // Encode the reference for URL
      const encodedRef = encodeURIComponent(cleanReference);
      const url = `${this.baseUrl}/${encodedRef}?translation=${translation}`;
      
      this.logger.log(`Fetching verse: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json();
      
      // Parse the response
      return this.parseVerseResponse(data);
    } catch (error) {
      this.logger.error(`Error fetching verse: ${error.message}`);
      throw new HttpException(
        'Failed to fetch Bible verse',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Fetch multiple verses (passage)
   * Example: getPassage('John 3:16-18', 'kjv')
   */
  async getPassage(reference: string, translation: string = 'kjv'): Promise<BibleSearchResult> {
    try {
      const cleanReference = decodeURIComponent(reference);
      const encodedRef = encodeURIComponent(cleanReference);
      const url = `${this.baseUrl}/${encodedRef}?translation=${translation}`;
      
      this.logger.log(`Fetching passage: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new HttpException(
          `Bible API error: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json();
      
      return this.parsePassageResponse(data);
    } catch (error) {
      this.logger.error(`Error fetching passage: ${error.message}`);
      throw new HttpException(
        'Failed to fetch Bible passage',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get a random verse with fallback
   */
  async getRandomVerse(translation: string = 'kjv'): Promise<BibleVerseResponse> {
    // Try the API first
    try {
      const url = `${this.baseUrl}/random?translation=${translation}`;
      this.logger.log(`Fetching random verse: ${url}`);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        return this.parseVerseResponse(data);
      } else {
        this.logger.warn(`Random API returned ${response.status}, using fallback`);
      }
    } catch (error) {
      this.logger.warn(`Random API failed, using fallback: ${error.message}`);
    }
    
    // Fallback: pick a random verse from popular list
    const randomIndex = Math.floor(Math.random() * this.popularVerses.length);
    const randomReference = this.popularVerses[randomIndex];
    
    this.logger.log(`Using fallback random verse: ${randomReference}`);
    
    try {
      return await this.getVerse(randomReference, translation);
    } catch (fallbackError) {
      this.logger.error(`Fallback also failed: ${fallbackError.message}`);
      
      // Ultimate fallback - return hardcoded data
      return {
        reference: "John 3:16",
        book: "John",
        chapter: 3,
        verse: 16,
        text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
        translation: "King James Version",
        translationCode: "kjv"
      };
    }
  }

  /**
   * Search for verses by book, chapter, and verse range
   */
  async searchVerses(book: string, chapter: number, verseStart: number, verseEnd?: number, translation: string = 'kjv'): Promise<BibleSearchResult> {
    let reference = `${book} ${chapter}:${verseStart}`;
    if (verseEnd) {
      reference += `-${verseEnd}`;
    }
    
    return this.getPassage(reference, translation);
  }

  /**
   * Validate if a verse reference exists
   */
  async validateVerse(reference: string, translation: string = 'kjv'): Promise<boolean> {
    try {
      await this.getVerse(reference, translation);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get available translations
   */
  getTranslations() {
    return this.availableTranslations;
  }

  /**
   * Parse single verse response from API
   */
  private parseVerseResponse(data: any): BibleVerseResponse {
    // Handle different response formats
    const verses = data.verses || [data];
    const firstVerse = Array.isArray(verses) ? verses[0] : verses;
    
    return {
      reference: data.reference || `${firstVerse.book_name} ${firstVerse.chapter}:${firstVerse.verse}`,
      book: firstVerse.book_name || firstVerse.book,
      chapter: parseInt(firstVerse.chapter),
      verse: parseInt(firstVerse.verse),
      text: data.text || firstVerse.text,
      translation: data.translation?.name || 'King James Version',
      translationCode: data.translation?.abbreviation?.toLowerCase() || 'kjv',
    };
  }

  /**
   * Parse passage response (multiple verses)
   */
  private parsePassageResponse(data: any): BibleSearchResult {
    const verses = data.verses || [];
    
    const parsedVerses = verses.map(v => ({
      reference: `${v.book_name} ${v.chapter}:${v.verse}`,
      book: v.book_name,
      chapter: parseInt(v.chapter),
      verse: parseInt(v.verse),
      text: v.text,
      translation: data.translation?.name || 'King James Version',
      translationCode: data.translation?.abbreviation?.toLowerCase() || 'kjv',
    }));
    
    return {
      verses: parsedVerses,
      passage: data.text || parsedVerses.map(v => v.text).join(' '),
    };
  }
}