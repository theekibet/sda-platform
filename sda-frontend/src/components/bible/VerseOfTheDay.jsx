// src/components/bible/VerseOfTheDay.jsx
import React, { useEffect } from 'react';
import { useBible } from '../../hooks/useBible';
import InteractiveVerseCard from './InteractiveVerseCard';

/**
 * Verse of the Day Component
 * Displays today's featured Bible verse with full interaction capabilities
 * Now simplified - just handles fetching, InteractiveVerseCard handles all interactions
 */
const VerseOfTheDay = ({ className = '' }) => {
  const { todaysVerse, loading, error, fetchTodaysVerse } = useBible();

  useEffect(() => {
    fetchTodaysVerse();
  }, []);

  if (loading) {
    return (
      <div style={styles.container} className={className}>
        <h2 style={styles.title}>✨ Verse of the Day</h2>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading today's verse...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container} className={className}>
        <h2 style={styles.title}>✨ Verse of the Day</h2>
        <div style={styles.error}>
          <p>Unable to load today's verse. Please try again later.</p>
          <button onClick={fetchTodaysVerse} style={styles.retryButton}>
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!todaysVerse) return null;

  return (
    <div style={styles.wrapper} className={className}>
      <h2 style={styles.title}>✨ Verse of the Day</h2>
      
      {/* Use the reusable InteractiveVerseCard */}
      <InteractiveVerseCard 
        verse={todaysVerse}
        showReadButton={true}
        showSharedBy={true}
      />

      {/* Show note if this is a random verse (no scheduled verse for today) */}
      {todaysVerse.isRandom && (
        <p style={styles.note}>
          💡 No scheduled verse today. Enjoy this random verse from Scripture!
        </p>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  container: {
    marginBottom: '30px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#666',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  error: {
    padding: '40px 20px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '8px',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  note: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    marginTop: '16px',
    fontStyle: 'italic',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default VerseOfTheDay;