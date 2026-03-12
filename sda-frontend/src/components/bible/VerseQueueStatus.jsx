// src/components/bible/VerseQueueStatus.jsx
import React, { useEffect } from 'react';
import { useBible } from '../../hooks/useBible';

const VerseQueueStatus = () => {
  const { queueStatus, loading, error, fetchQueueStatus } = useBible();

  useEffect(() => {
    fetchQueueStatus();
  }, []);

  if (loading) return <div>Loading queue...</div>;
  if (error) return <div>Error loading queue</div>;
  if (!queueStatus) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>📋 Verse Queue</h4>
      <div style={styles.stats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{queueStatus.pending}</span>
          <span style={styles.statLabel}>Pending</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>{queueStatus.scheduled}</span>
          <span style={styles.statLabel}>Scheduled</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>
            {queueStatus.pending + queueStatus.scheduled}
          </span>
          <span style={styles.statLabel}>Total</span>
        </div>
      </div>

      <div style={styles.nextDate}>
        <strong>Next available:</strong> {formatDate(queueStatus.nextAvailableDate)}
      </div>

      {queueStatus.pending === 0 && queueStatus.scheduled === 0 ? (
        <p style={styles.emptyMessage}>
          ✨ Be the first to share a verse!
        </p>
      ) : (
        <p style={styles.info}>
          <a href="/my-submissions" style={styles.link}>View my submissions →</a>
        </p>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  title: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '16px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '15px',
  },
  stat: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '11px',
    color: '#666',
  },
  nextDate: {
    padding: '10px',
    backgroundColor: '#f0f4ff',
    borderRadius: '5px',
    fontSize: '13px',
    marginBottom: '10px',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#27ae60',
    fontSize: '13px',
    margin: '10px 0 0',
  },
  info: {
    textAlign: 'center',
    margin: '10px 0 0',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '13px',
  },
};

export default VerseQueueStatus;