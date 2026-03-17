// src/components/bible/VerseCard.jsx
// OPTION 3: Modern Brush with "Blessed through"
import React from 'react';

const VerseCard = ({ 
  verse, 
  showShare = false, 
  showSharedBy = true,
  onShare, 
  className = '' 
}) => {
  if (!verse) return null;

  const verseData = verse.verse || verse;
  
  const reference = verseData?.reference || 
    (verseData?.book && verseData?.chapter && verseData?.verse 
      ? `${verseData.book} ${verseData.chapter}:${verseData.verse}` 
      : 'Unknown Reference');
  
  const text = verseData?.text || '';
  const translation = verseData?.translation || 'KJV';
  const sharedBy = verse?.user?.name;

  if (!text) return null;

  return (
    <div style={styles.container} className={className}>
      {showShare && onShare && (
        <button onClick={onShare} style={styles.shareButton}>
          📤 Share
        </button>
      )}

      <div style={styles.reference}>{reference}</div>
      <div style={styles.verse}>"{text.trim()}"</div>
      <div style={styles.translation}>{translation}</div>
      
      {showSharedBy && sharedBy && (
        <div style={styles.sharedBy}>
          <div style={styles.gradientLine}></div>
          <div style={styles.sharedByContent}>
            <span style={styles.sharedByIcon}>🌹</span>
            <span style={styles.sharedByText}>
              Shared by: <span style={styles.sharedByName}>{sharedBy}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '28px',
    position: 'relative',
  },
  shareButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
    boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)',
  },
  reference: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
    marginBottom: '16px',
    letterSpacing: '-0.3px',
  },
  verse: {
    fontSize: '20px',
    lineHeight: '1.7',
    color: '#2d3748',
    marginBottom: '16px',
    fontStyle: 'italic',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'Georgia, serif',
  },
  translation: {
    fontSize: '14px',
    color: '#a0aec0',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sharedBy: {
    paddingTop: '16px',
    marginTop: '16px',
  },
  gradientLine: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #cbd5e0, transparent)',
    marginBottom: '12px',
  },
  sharedByContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  sharedByIcon: {
    fontSize: '18px',
  },
  sharedByText: {
    fontSize: '15px',
    color: '#718096',
    fontFamily: "'Satisfy', cursive",
  },
  sharedByName: {
    color: '#667eea',
    fontWeight: '700',
    fontSize: '19px',
    letterSpacing: '0.5px',
  },
};

// Add Google Font for Satisfy
if (typeof document !== 'undefined') {
  const existingLink = document.querySelector('link[href*="Satisfy"]');
  if (!existingLink) {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Satisfy&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }
}

export default VerseCard;