// src/components/bible/VerseCard.jsx
import React from 'react';

const VerseCard = ({ verse, showShare = false, onShare, className = '' }) => {
  // Safety check - if verse is undefined, don't render
  if (!verse) {
    return null;
  }

  // Handle different data structures safely
  const verseData = verse.verse || verse;
  
  // Safely access properties with fallbacks
  const reference = verseData?.reference || 
    (verseData?.book && verseData?.chapter && verseData?.verse 
      ? `${verseData.book} ${verseData.chapter}:${verseData.verse}` 
      : 'Unknown Reference');
  
  const text = verseData?.text || '';
  const translation = verseData?.translation || 'KJV';
  const sharedBy = verse?.user?.name;

  // Don't render if there's no text
  if (!text) {
    return null;
  }

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      maxWidth: '600px',
      margin: '0 auto',
      position: 'relative',
    },
    verse: {
      fontSize: '20px',
      lineHeight: '1.6',
      color: '#2d3748',
      marginBottom: '16px',
      fontStyle: 'italic',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    },
    reference: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#667eea',
      marginBottom: '8px',
    },
    translation: {
      fontSize: '14px',
      color: '#a0aec0',
      marginBottom: '16px',
    },
    sharedBy: {
      fontSize: '14px',
      color: '#718096',
      borderTop: '1px solid #e2e8f0',
      paddingTop: '16px',
      marginTop: '16px',
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
      transition: 'background-color 0.2s',
      ':hover': {
        backgroundColor: '#5a6fd8',
      },
    },
  };

  return (
    <div style={styles.container} className={className}>
      <div style={styles.reference}>{reference}</div>
      <div style={styles.verse}>"{text.trim()}"</div>
      <div style={styles.translation}>{translation}</div>
      {sharedBy && (
        <div style={styles.sharedBy}>Shared by: {sharedBy}</div>
      )}
      {showShare && onShare && (
        <button onClick={onShare} style={styles.shareButton}>
          Share This Verse
        </button>
      )}
    </div>
  );
};

export default VerseCard;