// src/pages/admin/bible/AdminVerseQueue.jsx
import { useState, useEffect } from 'react';
import { useAuth } from "../../../../contexts/AuthContext";

function AdminVerseQueue() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/admin/bible/submissions?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setSubmissions(data.data?.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/admin/bible/submissions/${selectedSubmission.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          scheduledFor: scheduledDate || undefined,
          notes: reason 
        })
      });
      setShowModal(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3000/admin/bible/submissions/${selectedSubmission.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      setShowModal(false);
      fetchSubmissions();
    } catch (error) {
      console.error('Error rejecting:', error);
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
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading submissions...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📖 Verse Moderation</h2>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {submissions.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No {filter} submissions found</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {submissions.map(sub => {
            const badge = getStatusBadge(sub.status);
            return (
              <div key={sub.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={{...styles.statusBadge, backgroundColor: badge.color}}>
                    {badge.text}
                  </span>
                  <span style={styles.date}>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div style={styles.verseContent}>
                  <h4 style={styles.reference}>{sub.verse?.reference}</h4>
                  <p style={styles.verseText}>"{sub.verse?.text}"</p>
                </div>

                {sub.comment && (
                  <div style={styles.comment}>
                    <strong>User's reflection:</strong>
                    <p>{sub.comment}</p>
                  </div>
                )}

                <div style={styles.userInfo}>
                  <p><strong>Submitted by:</strong> {sub.user?.name}</p>
                  <p><strong>Email:</strong> {sub.user?.email}</p>
                </div>

                {sub.scheduledFor && (
                  <div style={styles.scheduledInfo}>
                    📅 Scheduled for: {formatDate(sub.scheduledFor)}
                  </div>
                )}

                {sub.reviewNotes && (
                  <div style={styles.reviewNotes}>
                    <strong>Admin notes:</strong> {sub.reviewNotes}
                  </div>
                )}

                {sub.status === 'pending' && (
                  <div style={styles.actions}>
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setAction('approve');
                        setShowModal(true);
                      }}
                      style={styles.approveButton}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setAction('reject');
                        setShowModal(true);
                      }}
                      style={styles.rejectButton}
                    >
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showModal && selectedSubmission && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>{action === 'approve' ? 'Approve Verse' : 'Reject Verse'}</h3>
            
            <div style={styles.modalVerse}>
              <strong>{selectedSubmission.verse?.reference}</strong>
              <p>{selectedSubmission.verse?.text}</p>
            </div>

            {action === 'approve' && (
              <div style={styles.formGroup}>
                <label>Schedule for (optional):</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  style={styles.input}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            <div style={styles.formGroup}>
              <label>{action === 'approve' ? 'Admin notes (optional):' : 'Reason for rejection:'}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={styles.textarea}
                rows="3"
                placeholder={action === 'reject' ? 'Explain why this verse was rejected...' : ''}
              />
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={action === 'approve' ? handleApprove : handleReject}
                style={action === 'approve' ? styles.confirmApproveButton : styles.confirmRejectButton}
              >
                {action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  filterSelect: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    color: '#999',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
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
  verseContent: {
    marginBottom: '15px',
  },
  reference: {
    margin: '0 0 10px 0',
    color: '#667eea',
  },
  verseText: {
    color: '#666',
    fontStyle: 'italic',
    lineHeight: '1.6',
    margin: 0,
  },
  comment: {
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  userInfo: {
    marginBottom: '15px',
    fontSize: '13px',
    color: '#666',
  },
  scheduledInfo: {
    marginBottom: '15px',
    padding: '8px',
    backgroundColor: '#e8f4fd',
    borderRadius: '5px',
    fontSize: '13px',
  },
  reviewNotes: {
    marginBottom: '15px',
    padding: '8px',
    backgroundColor: '#fff3cd',
    borderRadius: '5px',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  approveButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  rejectButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalVerse: {
    margin: '20px 0',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginTop: '5px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginTop: '5px',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  confirmApproveButton: {
    padding: '8px 16px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  confirmRejectButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default AdminVerseQueue;