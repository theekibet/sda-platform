// src/pages/admin/security/Sessions.jsx
import React, { useState, useEffect } from 'react';
import { getActiveSessions, terminateSession, terminateAllUserSessions } from '../../../services/api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showTerminateAll, setShowTerminateAll] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchSessions();
  }, [pagination.page]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getActiveSessions({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setSessions(response.data.sessions || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load active sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this session?')) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await terminateSession(sessionId);
      setSuccess('Session terminated successfully');
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerminateAllUserSessions = async (userId) => {
    if (!window.confirm('Are you sure you want to terminate ALL sessions for this user?')) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await terminateAllUserSessions(userId);
      setSuccess('All user sessions terminated');
      setShowTerminateAll(false);
      setSelectedUserId(null);
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs < 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins} minutes`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days`;
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return '💻';
    
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile')) return '📱';
    if (ua.includes('tablet')) return '📱';
    if (ua.includes('mac')) return '💻';
    if (ua.includes('windows')) return '🖥️';
    if (ua.includes('linux')) return '🐧';
    return '💻';
  };

  if (loading && sessions.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading active sessions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>🖥️ Active Sessions</h3>
        <div style={styles.stats}>
          <span style={styles.stat}>
            <strong>{pagination.total}</strong> active sessions
          </span>
        </div>
      </div>

      <p style={styles.description}>
        View and manage all active user sessions across the platform.
      </p>

      {/* Messages */}
      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.success}>
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Sessions Table */}
      {sessions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💤</div>
          <h4 style={styles.emptyTitle}>No Active Sessions</h4>
          <p style={styles.emptyText}>There are no active user sessions at the moment.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Device</th>
                <th>IP Address</th>
                <th>Last Active</th>
                <th>Expires In</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id}>
                  <td>
                    <div style={styles.userCell}>
                      <div style={styles.userAvatar}>
                        {session.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.userName}>{session.user?.name}</div>
                        <div style={styles.userEmail}>{session.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={styles.deviceInfo}>
                      <span style={styles.deviceIcon}>
                        {getDeviceIcon(session.userAgent)}
                      </span>
                      <span>{session.userAgent?.split(' ')[0] || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <code style={styles.ipCode}>{session.ipAddress || 'Unknown'}</code>
                  </td>
                  <td>{formatDate(session.lastActive)}</td>
                  <td>
                    <span style={{
                      ...styles.timeRemaining,
                      color: getTimeRemaining(session.expiresAt).includes('hour') ? '#f39c12' : '#27ae60',
                    }}>
                      {getTimeRemaining(session.expiresAt)}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: session.isRevoked ? '#95a5a6' : '#27ae60',
                    }}>
                      {session.isRevoked ? 'Revoked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => {
                          setSelectedUserId(session.user?.id);
                          setShowTerminateAll(true);
                        }}
                        style={styles.terminateAllButton}
                        title="Terminate all sessions for this user"
                      >
                        🔚 All
                      </button>
                      <button
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={actionLoading || session.isRevoked}
                        style={styles.terminateButton}
                        title="Terminate this session"
                      >
                        🔚
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            style={styles.pageButton}
          >
            ← Previous
          </button>
          <span style={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
            style={styles.pageButton}
          >
            Next →
          </button>
        </div>
      )}

      {/* Terminate All Confirmation Modal */}
      {showTerminateAll && selectedUserId && (
        <div style={styles.modalOverlay} onClick={() => setShowTerminateAll(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Terminate All Sessions</h3>
            <p style={styles.modalText}>
              Are you sure you want to terminate ALL active sessions for this user?
              This will force them to log in again on all devices.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowTerminateAll(false)}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleTerminateAllUserSessions(selectedUserId)}
                disabled={actionLoading}
                style={{
                  ...styles.modalConfirmButton,
                  ...(actionLoading ? styles.buttonDisabled : {}),
                }}
              >
                {actionLoading ? 'Terminating...' : 'Yes, Terminate All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px 0',
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
    width: '30px',
    height: '30px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '18px',
    fontWeight: '600',
  },
  stats: {
    display: 'flex',
    gap: '10px',
  },
  stat: {
    padding: '4px 8px',
    backgroundColor: '#f0f4ff',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#667eea',
  },
  description: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '14px',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  emptyTitle: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '16px',
  },
  emptyText: {
    margin: 0,
    color: '#999',
    fontSize: '14px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: '11px',
    color: '#999',
  },
  deviceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  deviceIcon: {
    fontSize: '16px',
  },
  ipCode: {
    padding: '2px 4px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px',
    fontFamily: 'monospace',
  },
  timeRemaining: {
    fontSize: '12px',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '3px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    color: 'white',
  },
  actionButtons: {
    display: 'flex',
    gap: '5px',
  },
  terminateAllButton: {
    padding: '4px 6px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '10px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e67e22',
    },
  },
  terminateButton: {
    padding: '4px 6px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '12px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  pageInfo: {
    fontSize: '13px',
    color: '#666',
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
    zIndex: 10000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '400px',
    width: '90%',
  },
  modalTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '18px',
  },
  modalText: {
    margin: '0 0 20px 0',
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  modalConfirmButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default Sessions;