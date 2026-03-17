// src/pages/members/MySubmissions.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBible } from '../../hooks/useBible';
import VerseCard from '../../components/bible/VerseCard';

function MySubmissions() {
  const { user } = useAuth();
  const { mySubmissions, loading, cancelSubmission, fetchMySubmissions } = useBible();
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [queueStats, setQueueStats] = useState(null);

  useEffect(() => {
    fetchMySubmissions();
    fetchQueueStats();
  }, []);

  const fetchQueueStats = async () => {
    try {
      // You'll need to add this to your useBible hook or call directly
      const response = await bibleService.getMyQueueStats();
      setQueueStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
    }
  };

  const handleCancelSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to cancel this submission? This action cannot be undone.')) {
      return;
    }

    setCancellingId(submissionId);
    const result = await cancelSubmission(submissionId);
    
    if (!result.success) {
      setError(result.error || 'Failed to cancel submission');
    }
    setCancellingId(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#f39c12', text: '⏳ Pending Review', icon: '⏳' },
      approved: { color: '#3498db', text: '✅ Approved', icon: '✅' },
      scheduled: { color: '#27ae60', text: '📅 Scheduled', icon: '📅' },
      published: { color: '#27ae60', text: '✨ Published', icon: '✨' },
      rejected: { color: '#e74c3c', text: '❌ Rejected', icon: '❌' },
    };
    return badges[status] || { color: '#95a5a6', text: status, icon: '📄' };
  };

  const getQueuePosition = (submission) => {
    if (!queueStats || submission.status !== 'pending') return null;
    const stats = queueStats.yourSubmissions?.find(s => s.id === submission.id);
    return stats?.position;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading your submissions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📤 My Shared Verses</h2>
        <div style={styles.stats}>
          <span style={styles.stat}>
            Total: <strong>{mySubmissions.length}</strong>
          </span>
          <span style={styles.stat}>
            Pending: <strong>{mySubmissions.filter(s => s.status === 'pending').length}</strong>
          </span>
          {queueStats && (
            <span style={styles.stat}>
              Queue: <strong>{queueStats.totalPending} total</strong>
            </span>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {mySubmissions.length === 0 ? (
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
          {mySubmissions.map(sub => {
            const badge = getStatusBadge(sub.status);
            const isExpanded = expandedId === sub.id;
            const queuePosition = getQueuePosition(sub);
            
            return (
              <div key={sub.id} style={styles.submissionCard}>
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div style={styles.headerLeft}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: badge.color,
                    }}>
                      {badge.icon} {badge.text}
                    </span>
                    <span style={styles.submittedTime}>
                      {formatRelativeTime(sub.createdAt)}
                    </span>
                  </div>
                  <button 
                    onClick={() => toggleExpand(sub.id)}
                    style={styles.expandButton}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>

                {/* Verse Preview (always visible) */}
                <div style={styles.versePreview}>
                  <VerseCard verse={sub.verse} />
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={styles.expandedDetails}>
                    {/* User's Reflection */}
                    {sub.comment && (
                      <div style={styles.comment}>
                        <strong>Your reflection:</strong>
                        <p>{sub.comment}</p>
                      </div>
                    )}

                    {/* Submission Details Grid */}
                    <div style={styles.detailsGrid}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Submission ID</span>
                        <span style={styles.detailValue}>#{sub.id.slice(-8)}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Submitted</span>
                        <span style={styles.detailValue}>{formatDate(sub.createdAt)}</span>
                      </div>
                      {sub.scheduledFor && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Scheduled for</span>
                          <span style={styles.detailValue}>{formatDate(sub.scheduledFor)}</span>
                        </div>
                      )}
                      {sub.status === 'pending' && queuePosition && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Queue Position</span>
                          <span style={styles.detailValue}>
                            #{queuePosition} of {queueStats?.totalPending || '?'}
                          </span>
                        </div>
                      )}
                      {sub.status === 'approved' && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Approved on</span>
                          <span style={styles.detailValue}>
                            {sub.reviewedAt ? formatDate(sub.reviewedAt) : 'Recently'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Feedback (if any) */}
                    {sub.reviewNotes && (
                      <div style={sub.status === 'rejected' ? styles.rejectionNote : styles.reviewNotes}>
                        <strong>{sub.status === 'rejected' ? '❌ Rejection reason:' : '📝 Admin notes:'}</strong>
                        <p>{sub.reviewNotes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={styles.actionButtons}>
                      {sub.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleCancelSubmission(sub.id)}
                            disabled={cancellingId === sub.id}
                            style={styles.cancelButton}
                          >
                            {cancellingId === sub.id ? 'Cancelling...' : '❌ Cancel Submission'}
                          </button>
                          <button 
                            onClick={() => window.location.href = `/bible/read/${sub.verse.book}/${sub.verse.chapter}`}
                            style={styles.viewButton}
                          >
                            📖 Read in Context
                          </button>
                        </>
                      )}
                      {sub.status === 'approved' && (
                        <button 
                          onClick={() => window.location.href = `/bible/read/${sub.verse.book}/${sub.verse.chapter}`}
                          style={styles.viewButton}
                        >
                          📖 View Verse
                        </button>
                      )}
                      {sub.status === 'scheduled' && sub.scheduledFor && (
                        <div style={styles.scheduledMessage}>
                          <span>📅 This verse will be published on {formatDate(sub.scheduledFor)}</span>
                        </div>
                      )}
                      {sub.status === 'rejected' && (
                        <button 
                          onClick={() => {
                            window.location.href = `/bible/read/${sub.verse.book}/${sub.verse.chapter}`;
                          }}
                          style={styles.resubmitButton}
                        >
                          🔄 Try a Different Verse
                        </button>
                      )}
                      {sub.status === 'published' && (
                        <button 
                          onClick={() => window.open(`/bible/read/${sub.verse.book}/${sub.verse.chapter}`, '_blank')}
                          style={styles.viewPublishedButton}
                        >
                          ✨ View Published Verse
                        </button>
                      )}
                    </div>
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
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    color: '#333',
    fontSize: '28px',
    margin: 0,
  },
  stats: {
    display: 'flex',
    gap: '15px',
    backgroundColor: '#f0f4ff',
    padding: '8px 16px',
    borderRadius: '20px',
  },
  stat: {
    fontSize: '14px',
    color: '#4a5568',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: '#666',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
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
    gap: '15px',
  },
  submissionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '13px',
    fontWeight: '500',
  },
  submittedTime: {
    fontSize: '13px',
    color: '#999',
  },
  expandButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#667eea',
    cursor: 'pointer',
    padding: '5px 10px',
    borderRadius: '5px',
  },
  versePreview: {
    marginBottom: '10px',
  },
  expandedDetails: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eaeaea',
  },
  comment: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  detailItem: {
    backgroundColor: '#f9f9f9',
    padding: '12px',
    borderRadius: '8px',
  },
  detailLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#999',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#333',
    fontWeight: '500',
  },
  reviewNotes: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
    fontSize: '14px',
  },
  rejectionNote: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#fee',
    borderRadius: '8px',
    color: '#c33',
    fontSize: '14px',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  viewButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  resubmitButton: {
    padding: '8px 16px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  viewPublishedButton: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  scheduledMessage: {
    padding: '8px 16px',
    backgroundColor: '#e8f4fd',
    borderRadius: '5px',
    color: '#0c5460',
    fontSize: '13px',
  },
};

// Add keyframe animation
const styleSheet = document.styleSheets[0];
const keyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (styleSheet) {
  styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
}

export default MySubmissions;