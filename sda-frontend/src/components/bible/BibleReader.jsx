// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bibleService } from '../../services/bibleService';
import { 
  getBookNames, 
  getChapterArray,
  BOOK_CHAPTERS_MAP,
} from '../../constants/bibleData';
import ShareVerseModal from './ShareVerseModal';
import './BibleReader.css';

const BibleReader = ({ 
  mode = 'fullscreen',
  initialBook = 'Genesis',
  initialChapter = 1,
  onClose,
  onVerseSelect 
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const versesContainerRef = useRef(null);
  
  const [selectedBook, setSelectedBook] = useState(params.book || initialBook);
  const [selectedChapter, setSelectedChapter] = useState(
    params.chapter ? parseInt(params.chapter) : initialChapter
  );
  
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem('bibleFontSize')) || 20
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('bibleDarkMode') === 'true' || false
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [savedNotes, setSavedNotes] = useState({});

  // Selection menu state
  const [selectionMenu, setSelectionMenu] = useState({
    show: false,
    x: 0,
    y: 0,
    text: '',
    verses: []
  });
  const [showCopyToast, setShowCopyToast] = useState(false);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);

  const books = getBookNames();
  const chapterOptions = getChapterArray(selectedBook);

  useEffect(() => {
    if (mode === 'fullscreen' && !params.book) {
      const savedPosition = localStorage.getItem('bibleReadingPosition');
      if (savedPosition) {
        const { book, chapter } = JSON.parse(savedPosition);
        setSelectedBook(book);
        setSelectedChapter(chapter);
      }
    }
  }, [mode, params.book]);

  useEffect(() => {
    if (selectedBook && selectedChapter && mode === 'fullscreen') {
      localStorage.setItem('bibleReadingPosition', JSON.stringify({
        book: selectedBook,
        chapter: selectedChapter,
        timestamp: new Date().toISOString()
      }));
    }
  }, [selectedBook, selectedChapter, mode]);

  useEffect(() => {
    const notes = localStorage.getItem('bibleNotes');
    if (notes) {
      setSavedNotes(JSON.parse(notes));
    }
  }, []);

  useEffect(() => {
    if (mode === 'fullscreen' && navigate) {
      navigate(`/bible/read/${selectedBook}/${selectedChapter}`, { replace: true });
    }
  }, [selectedBook, selectedChapter, mode, navigate]);

  useEffect(() => {
    fetchChapter();
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    localStorage.setItem('bibleFontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('bibleDarkMode', darkMode);
  }, [darkMode]);

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0 && versesContainerRef.current?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const selectedVerses = [];
        verses.forEach(verse => {
          if (selectedText.includes(verse.text.substring(0, 20))) {
            selectedVerses.push(verse);
          }
        });
        
        setSelectionMenu({
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          text: selectedText,
          verses: selectedVerses.length > 0 ? selectedVerses : [verses[0]]
        });
      } else {
        setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  }, [verses]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectionMenu.show && !e.target.closest('.selection-menu')) {
        setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectionMenu.show]);

  const fetchChapter = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bibleService.getChapter(selectedBook, selectedChapter, 'kjv');
      let versesData = response.data?.data || response.data || response.verses || [];
      versesData.sort((a, b) => a.verse - b.verse);
      setVerses(versesData);
      
      const noteKey = `${selectedBook}_${selectedChapter}`;
      if (savedNotes[noteKey]) {
        setCurrentNote(savedNotes[noteKey]);
      } else {
        setCurrentNote('');
      }
    } catch (err) {
      setError('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      const bookIndex = books.indexOf(selectedBook);
      if (bookIndex > 0) {
        const prevBook = books[bookIndex - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(BOOK_CHAPTERS_MAP[prevBook]);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < BOOK_CHAPTERS_MAP[selectedBook]) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      const bookIndex = books.indexOf(selectedBook);
      if (bookIndex < books.length - 1) {
        setSelectedBook(books[bookIndex + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const handleSaveNote = () => {
    const key = `${selectedBook}_${selectedChapter}`;
    const updatedNotes = {
      ...savedNotes,
      [key]: currentNote
    };
    setSavedNotes(updatedNotes);
    localStorage.setItem('bibleNotes', JSON.stringify(updatedNotes));
    setShowNotes(false);
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 14));

  const handleVerseClick = (verse) => {
    if (onVerseSelect) {
      onVerseSelect(verse);
    }
  };

  const handleCopy = async () => {
    try {
      let textToCopy = selectionMenu.text;
      
      if (selectionMenu.verses.length > 0) {
        const verseRefs = selectionMenu.verses.map(v => v.verse).join(', ');
        textToCopy = `"${selectionMenu.text}"\n\n${selectedBook} ${selectedChapter}:${verseRefs} (KJV)`;
      }
      
      await navigator.clipboard.writeText(textToCopy);
      setShowCopyToast(true);
      setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
      
      setTimeout(() => setShowCopyToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = () => {
    // Create a verse object from the selected text
    const primaryVerse = selectionMenu.verses[0] || verses[0];
    
    const verseToShare = {
      id: primaryVerse.id,
      reference: `${selectedBook} ${selectedChapter}:${primaryVerse.verse}`,
      text: selectionMenu.text || primaryVerse.text,
      book: selectedBook,
      chapter: selectedChapter,
      verse: primaryVerse.verse
    };
    
    setSelectedVerse(verseToShare);
    setShowShareModal(true);
    setSelectionMenu({ show: false, x: 0, y: 0, text: '', verses: [] });
  };

  if (mode === 'modal') {
    return (
      <div className="bible-reader-overlay" onClick={onClose}>
        <div 
          className={`bible-reader-modal ${darkMode ? 'dark-mode' : ''}`} 
          onClick={e => e.stopPropagation()}
        >
          <div className="bible-reader-header">
            <div className="header-left">
              <h2>📖 Bible Reader</h2>
            </div>
            <div className="header-right">
              <button 
                onClick={() => window.open(`/bible/read/${selectedBook}/${selectedChapter}`, '_blank')}
                className="icon-btn"
                title="Open in Full Screen"
              >
                ⛶
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button onClick={onClose} className="icon-btn">✕</button>
            </div>
          </div>

          <div className="bible-reader-controls">
            <select 
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="book-select"
            >
              {books.map(book => (
                <option key={book} value={book}>{book}</option>
              ))}
            </select>
            
            <select 
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="chapter-select"
            >
              {chapterOptions.map(ch => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>

            <div className="font-controls">
              <button onClick={decreaseFontSize}>A-</button>
              <span>{fontSize}px</span>
              <button onClick={increaseFontSize}>A+</button>
            </div>
          </div>

          <div 
            ref={versesContainerRef}
            className="bible-reader-verses" 
            style={{ fontSize: `${fontSize}px` }}
          >
            {loading ? (
              <div className="loading">Loading...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              verses.map(verse => (
                <div 
                  key={verse.verse} 
                  className="verse"
                  onClick={() => handleVerseClick(verse)}
                >
                  <span className="verse-num">{verse.verse}</span>
                  <span className="verse-text">{verse.text}</span>
                </div>
              ))
            )}
          </div>

          {selectionMenu.show && (
            <div 
              className="selection-menu"
              style={{
                position: 'fixed',
                left: `${selectionMenu.x}px`,
                top: `${selectionMenu.y}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <button onClick={handleCopy} className="selection-menu-btn copy">
                📋 Copy
              </button>
              <button onClick={handleShare} className="selection-menu-btn share">
                📤 Share
              </button>
            </div>
          )}

          {showCopyToast && (
            <div className="copy-success-toast">
              ✓ Copied to clipboard!
            </div>
          )}

          {/* ShareVerseModal */}
          {showShareModal && selectedVerse && (
            <ShareVerseModal
              verse={selectedVerse}
              onClose={() => {
                setShowShareModal(false);
                setSelectedVerse(null);
              }}
              onSuccess={(data) => {
                console.log('Verse shared successfully:', data);
                setShowShareModal(false);
                setSelectedVerse(null);
              }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bible-full ${darkMode ? 'dark-mode' : ''}`}>
      <header className="bible-full-header">
        <div className="header-left">
          <button 
            className="icon-btn"
            onClick={() => navigate('/dashboard')}
            title="Back to Dashboard"
          >
            ←
          </button>
          <select 
            value={selectedBook}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="book-select"
          >
            {books.map(book => (
              <option key={book} value={book}>{book}</option>
            ))}
          </select>
          
          <select 
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(Number(e.target.value))}
            className="chapter-select"
          >
            {chapterOptions.map(ch => (
              <option key={ch} value={ch}>Chapter {ch}</option>
            ))}
          </select>
        </div>

        <div className="header-right">
          <button onClick={() => setShowSettings(!showSettings)} className="icon-btn" title="Settings">
            ⚙️
          </button>
          <button onClick={() => setShowNotes(!showNotes)} className="icon-btn" title="Notes">
            📝
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="icon-btn" title="Toggle Theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => navigate('/dashboard')} className="icon-btn" title="Close">
            ✕
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel">
          <div className="settings-content">
            <div className="font-controls">
              <span>Font Size: {fontSize}px</span>
              <div>
                <button onClick={decreaseFontSize}>A-</button>
                <button onClick={increaseFontSize}>A+</button>
              </div>
            </div>
            <div className="reading-progress">
              <span>Chapter {selectedChapter} of {BOOK_CHAPTERS_MAP[selectedBook]}</span>
            </div>
          </div>
        </div>
      )}

      {showNotes && (
        <div className="notes-panel">
          <div className="notes-header">
            <h3>Notes for {selectedBook} {selectedChapter}</h3>
            <button onClick={() => setShowNotes(false)}>✕</button>
          </div>
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Write your reflections here..."
            rows={10}
          />
          <button onClick={handleSaveNote} className="save-note-btn">
            Save Note
          </button>
        </div>
      )}

      <main className="bible-full-content">
        <div className="chapter-header">
          <h1>{selectedBook} {selectedChapter}</h1>
          <div className="chapter-nav">
            <button onClick={handlePrevChapter} className="nav-btn">← Previous</button>
            <button onClick={handleNextChapter} className="nav-btn">Next →</button>
          </div>
        </div>

        <div 
          ref={versesContainerRef}
          className="verses-container"
          style={{ fontSize: `${fontSize}px` }}
        >
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            verses.map(verse => (
              <div 
                key={verse.verse} 
                className="verse"
                onClick={() => handleVerseClick(verse)}
              >
                <span className="verse-num">{verse.verse}</span>
                <span className="verse-text">{verse.text}</span>
              </div>
            ))
          )}
        </div>
      </main>

      {selectionMenu.show && (
        <div 
          className="selection-menu"
          style={{
            position: 'fixed',
            left: `${selectionMenu.x}px`,
            top: `${selectionMenu.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <button onClick={handleCopy} className="selection-menu-btn copy">
            📋 Copy
          </button>
          <button onClick={handleShare} className="selection-menu-btn share">
            📤 Share
          </button>
        </div>
      )}

      {showCopyToast && (
        <div className="copy-success-toast">
          ✓ Copied to clipboard!
        </div>
      )}

      {/* ShareVerseModal */}
      {showShareModal && selectedVerse && (
        <ShareVerseModal
          verse={selectedVerse}
          onClose={() => {
            setShowShareModal(false);
            setSelectedVerse(null);
          }}
          onSuccess={(data) => {
            console.log('Verse shared successfully:', data);
            setShowShareModal(false);
            setSelectedVerse(null);
          }}
        />
      )}
    </div>
  );
};

export default BibleReader;