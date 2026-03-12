// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bibleService } from '../../services/bibleService';
import { useAuth } from '../../contexts/AuthContext';
import './BibleReader.css'; // Import the CSS file

const BibleReader = ({ onClose, onSelectVerse }) => {
  const { user } = useAuth();
  const versesContainerRef = useRef(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedVerseForShare, setSelectedVerseForShare] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Bible data
  const [selectedBook, setSelectedBook] = useState('Luke');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [translations, setTranslations] = useState([]);
  const [selectedTranslation, setSelectedTranslation] = useState('kjv');
  
  // Reading preferences
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
  
  // All books of the Bible
  const books = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
    '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
    'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
    'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
    'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ];

  // Chapter mapping for each book
  const bookChapters = {
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

  // Load translations on mount
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const res = await bibleService.getTranslations();
        setTranslations(res.data.data || []);
      } catch (err) {
        console.error('Error loading translations:', err);
      }
    };
    loadTranslations();
  }, []);

  // Update max chapters when book changes
  useEffect(() => {
    setMaxChapter(bookChapters[selectedBook] || 150);
    setSelectedChapter(1);
  }, [selectedBook]);

  // Fetch chapter when book/chapter/translation changes
  useEffect(() => {
    fetchChapter();
  }, [selectedBook, selectedChapter, selectedTranslation]);

  const setMaxChapter = (max) => {
    // This is just for the select dropdown
  };

  const fetchChapter = async () => {
    setLoading(true);
    setError('');
    setSelectedText('');
    setSelectedVerseForShare(null);
    
    try {
      const response = await bibleService.getChapter(selectedBook, selectedChapter, selectedTranslation);
      
      let versesData = [];
      if (response.data?.data) {
        versesData = response.data.data;
      } else if (response.data) {
        versesData = response.data;
      } else if (response.verses) {
        versesData = response.verses;
      }
      
      // Sort verses by verse number
      versesData.sort((a, b) => a.verse - b.verse);
      setVerses(versesData);
      
      if (versesData.length === 0) {
        setError(`No verses found for ${selectedBook} ${selectedChapter}`);
      }
    } catch (err) {
      console.error('Error fetching chapter:', err);
      setError('Failed to load chapter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      setSelectedText(selectedText);
    } else {
      setSelectedText('');
    }
  }, []);

  // Handle verse hover for sharing
  const handleVerseHover = (verse) => {
    setSelectedVerseForShare(verse);
  };

  const handleVerseLeave = () => {
    // Don't clear immediately to allow clicking the tooltip
    setTimeout(() => {
      setSelectedVerseForShare(null);
    }, 200);
  };

  const handleShareClick = (verse) => {
    setSelectedVerseForShare(verse);
    setShowShareModal(true);
  };

  const handleSelectionShare = () => {
    if (selectedText) {
      // Find which verse contains the selected text
      const verse = verses.find(v => v.text.includes(selectedText.substring(0, 20)));
      if (verse) {
        setSelectedVerseForShare(verse);
        setShowShareModal(true);
      }
    }
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 14));
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const scrollToTop = () => {
    if (versesContainerRef.current) {
      versesContainerRef.current.scrollTop = 0;
    }
  };

  const getChapterRange = () => {
    const max = bookChapters[selectedBook] || 150;
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  return (
    <div className="bible-reader-overlay" onClick={onClose}>
      <div 
        className={`bible-reader-modal ${darkMode ? 'dark-mode' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bible-reader-header">
          <h2 className="bible-reader-title">📖 Bible Reader</h2>
          <button className="bible-reader-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Controls Bar */}
        <div className="bible-reader-controls">
          <div className="bible-reader-controls-left">
            <select
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="bible-reader-select"
            >
              {books.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>

            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="bible-reader-select"
            >
              {getChapterRange().map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>

            <select
              value={selectedTranslation}
              onChange={(e) => setSelectedTranslation(e.target.value)}
              className="bible-reader-select"
            >
              {translations.map(t => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="bible-reader-font-controls">
              <button onClick={decreaseFontSize} className="bible-reader-font-btn" title="Decrease font size">A-</button>
              <span className="bible-reader-font-size">{fontSize}px</span>
              <button onClick={increaseFontSize} className="bible-reader-font-btn" title="Increase font size">A+</button>
            </div>
            <button onClick={toggleDarkMode} className="bible-reader-theme-btn">
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Chapter Info */}
        <div className="bible-reader-chapter-info">
          <h3 className="bible-reader-chapter-title">
            {selectedBook} {selectedChapter}
          </h3>
          <p className="bible-reader-chapter-subtitle">
            {selectedTranslation.toUpperCase()} • {verses.length} verses
          </p>
        </div>

        {/* Text Selection Indicator (appears when text is selected) */}
        {selectedText && (
          <div className="bible-reader-reflection">
            <p>✨ "{selectedText.substring(0, 100)}..."</p>
            <button 
              className="bible-reader-reflection-btn"
              onClick={handleSelectionShare}
            >
              Share this passage
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bible-reader-loading">
            <div className="bible-reader-spinner"></div>
            <p>Loading chapter...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bible-reader-error">
            <p>{error}</p>
            <button onClick={fetchChapter} className="bible-reader-retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Verses Container */}
        {!loading && !error && (
          <div 
            ref={versesContainerRef}
            className="bible-reader-verses"
            onMouseUp={handleTextSelection}
            style={{ fontSize: `${fontSize}px` }}
          >
            {verses.length === 0 ? (
              <div className="bible-reader-no-verses">
                <p>No verses found</p>
                <button onClick={fetchChapter} className="bible-reader-retry-btn">
                  Retry
                </button>
              </div>
            ) : (
              verses.map((verse) => (
                <div
                  key={verse.id || verse.verse}
                  className={`bible-reader-verse ${
                    selectedVerseForShare?.verse === verse.verse ? 'selected-for-share' : ''
                  }`}
                  onMouseEnter={() => handleVerseHover(verse)}
                  onMouseLeave={handleVerseLeave}
                >
                  <span className="bible-reader-verse-number">{verse.verse}</span>
                  <span className="bible-reader-verse-text">{verse.text}</span>
                  
                  {/* Share tooltip appears on hover */}
                  {user && selectedVerseForShare?.verse === verse.verse && (
                    <button
                      className="bible-reader-share-tooltip"
                      onClick={() => handleShareClick(verse)}
                    >
                      📤 Share
                    </button>
                  )}
                </div>
              ))
            )}
            
            {/* End of chapter indicator with reflection prompt */}
            {verses.length > 0 && (
              <div className="bible-reader-end-chapter">
                <p>— End of {selectedBook} {selectedChapter} —</p>
                <div className="bible-reader-reflection">
                  <p>💭 What did this chapter teach you?</p>
                  <button className="bible-reader-reflection-btn">
                    Write a reflection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bible-reader-footer">
          <button onClick={scrollToTop} className="bible-reader-scroll-top">
            ↑ Scroll to Top
          </button>
          <p className="bible-reader-note">
            {user 
              ? 'Hover over any verse to share • Select text to highlight'
              : 'Login to share verses and write reflections'}
          </p>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && selectedVerseForShare && (
        <div className="bible-reader-selection-modal">
          <h3>Share This Verse</h3>
          <div className="bible-reader-selection-preview">
            <strong>{selectedBook} {selectedChapter}:{selectedVerseForShare.verse}</strong>
            <p>"{selectedVerseForShare.text.substring(0, 100)}..."</p>
          </div>
          <div className="bible-reader-selection-actions">
            <button 
              className="bible-reader-selection-cancel"
              onClick={() => {
                setShowShareModal(false);
                setSelectedVerseForShare(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="bible-reader-selection-share"
              onClick={() => {
                // Handle share logic here
                console.log('Sharing:', selectedVerseForShare);
                setShowShareModal(false);
              }}
            >
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleReader;