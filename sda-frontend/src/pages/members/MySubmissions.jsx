// src/pages/members/MySubmissions.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bibleService } from '../../services/bibleService';
import VerseCard from '../../components/bible/VerseCard';

function MySubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await bibleService.getMySubmissions();
      setSubmissions(response.data.data || []);
    } catch (err) {
      setError('Failed to load your submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f39c12', text: '⏳ Pending' },
      approved: { color: '#3498db', text: '✅ Approved' },
      scheduled: { color: '#27ae60', text: '📅 Scheduled' },
      published: { color: '#27ae60', text: '✨ Published' },
      rejected: { color: '#e74c3c', text: '❌ Rejected' },
    };
    return badges[status] || { color: '#95a5a6', text: status };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading your submissions...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📤 My Shared Verses</h2>

      {error && <div style={styles.error}>{error}</div>}

      {submissions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📖</div>
          <h3 style={styles.emptyTitle}>No Verses Shared Yet</h3>
          <p style={styles.emptyText}>
            Browse the Bible and share verses that speak to you. They'll be added to the queue for review.
          </p>
          <button 
            onClick={() => window.location.href = '/bible/reader'}
            style={styles.browseButton}
          >
            Browse Bible
          </button>
        </div>
      ) : (
        <div style={styles.submissionsList}>
          {submissions.map(sub => {
            const badge = getStatusBadge(sub.status);
            return (
              <div key={sub.id} style={styles.submissionCard}>
                <div style={styles.cardHeader}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: badge.color,
                  }}>
                    {badge.text}
                  </span>
                  <span style={styles.date}>
                    Submitted: {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <VerseCard verse={sub.verse} />

                {sub.comment && (
                  <div style={styles.comment}>
                    <strong>Your reflection:</strong>
                    <p>{sub.comment}</p>
                  </div>
                )}

                {sub.scheduledFor && (
                  <div style={styles.scheduledInfo}>
                    <span>📅 Scheduled for: {formatDate(sub.scheduledFor)}</span>
                  </div>
                )}

                {sub.reviewNotes && sub.status === 'rejected' && (
                  <div style={styles.rejectionNote}>
                    <strong>Reason:</strong> {sub.reviewNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    color: '#333',
    marginBottom: '30px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  error: {
    padding: '15px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '20px',
  },
  emptyTitle: {
    color: '#333',
    marginBottom: '10px',
  },
  emptyText: {
    color: '#999',
    marginBottom: '20px',
    maxWidth: '400px',
    margin: '0 auto 20px',
  },
  browseButton: {
    padding: '12px 30px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  submissionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  date: {
    fontSize: '12px',
    color: '#999',
  },
  comment: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  scheduledInfo: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e8f4fd',
    borderRadius: '5px',
    color: '#0c5460',
    fontSize: '13px',
  },
  rejectionNote: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#fee',
    borderRadius: '5px',
    color: '#c33',
    fontSize: '13px',
  },
};

export default MySubmissions;