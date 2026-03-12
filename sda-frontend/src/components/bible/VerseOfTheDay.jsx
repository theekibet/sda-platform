// src/components/Bible/VerseOfTheDay.jsx
import React, { useEffect } from 'react';
import { useBible } from '../../hooks/useBible';
import VerseCard from './VerseCard';

const VerseOfTheDay = ({ className = '' }) => {
  const { todaysVerse, loading, error, fetchTodaysVerse } = useBible();

  useEffect(() => {
    fetchTodaysVerse();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading verse of the day...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.error}>
        <p>Unable to load verse. Please try again later.</p>
      </div>
    );
  }

  if (!todaysVerse) return null;

  return (
    <div style={styles.container} className={className}>
      <h2 style={styles.title}>✨ Verse of the Day</h2>
      <VerseCard verse={todaysVerse} />
      {todaysVerse.isRandom && (
        <p style={styles.note}>No scheduled verse today. Enjoy this random verse!</p>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '16px',
    textAlign: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#666',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
  },
  error: {
    padding: '20px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '8px',
    textAlign: 'center',
  },
  note: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    marginTop: '12px',
    fontStyle: 'italic',
  },
};

export default VerseOfTheDay;