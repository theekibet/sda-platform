// src/pages/admin/security/LoginAttempts.jsx
import React, { useState, useEffect } from 'react';
import { getLoginAttempts, getFailedLoginAttempts } from '../../../services/api';

const LoginAttempts = () => {
  const [attempts, setAttempts] = useState([]);
  const [failedGrouped, setFailedGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(7);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'grouped'
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchData();
  }, [days, viewMode, pagination.page]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (viewMode === 'all') {
        const response = await getLoginAttempts(days, pagination.page, pagination.limit);
        setAttempts(response.data.attempts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        }));
      } else {
        const response = await getFailedLoginAttempts(days);
        setFailedGrouped(response.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load login attempts');
      console.error('Error fetching login attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (success) => {
    return {
      label: success ? 'Success' : 'Failed',
      color: success ? '#27ae60' : '#e74c3c',
    };
  };

  if (loading && attempts.length === 0 && failedGrouped.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading login attempts...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>🔐 Login Attempts</h3>
        <div style={styles.controls}>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <div style={styles.viewToggle}>
            <button
              onClick={() => setViewMode('all')}
              style={{
                ...styles.toggleButton,
                ...(viewMode === 'all' ? styles.toggleButtonActive : {}),
              }}
            >
              All Attempts
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              style={{
                ...styles.toggleButton,
                ...(viewMode === 'grouped' ? styles.toggleButtonActive : {}),
              }}
            >
              Failed by Email
            </button>
          </div>
        </div>
      </div>

      <p style={styles.description}>
        Monitor login attempts and identify potential security threats.
      </p>

      {/* Error Message */}
      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* All Attempts View */}
      {viewMode === 'all' && (
        <>
          {attempts.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <h4 style={styles.emptyTitle}>No Login Attempts</h4>
              <p style={styles.emptyText}>No login attempts recorded in this period.</p>
            </div>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>IP Address</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(attempt => {
                    const status = getStatusBadge(attempt.success);
                    
                    return (
                      <tr key={attempt.id}>
                        <td>
                          <div style={styles.emailCell}>
                            <span style={styles.email}>{attempt.email}</span>
                            {attempt.user && (
                              <span style={styles.userTag}>
                                {attempt.user.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <code style={styles.ipCode}>{attempt.ipAddress || 'Unknown'}</code>
                        </td>
                        <td>{formatDate(attempt.createdAt)}</td>
                        <td>
                          <span style={{
                            ...styles.statusBadge,
                            backgroundColor: status.color,
                          }}>
                            {status.label}
                          </span>
                          {attempt.failureReason && (
                            <span style={styles.failureReason}>
                              {attempt.failureReason}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={styles.userAgent}>
                            {attempt.userAgent || 'Unknown'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        </>
      )}

      {/* Grouped Failed Attempts View */}
      {viewMode === 'grouped' && (
        <>
          {failedGrouped.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🛡️</div>
              <h4 style={styles.emptyTitle}>No Failed Attempts</h4>
              <p style={styles.emptyText}>No failed login attempts in this period.</p>
            </div>
          ) : (
            <div style={styles.groupedContainer}>
              {failedGrouped.map(item => (
                <div key={item.email} style={styles.groupedCard}>
                  <div style={styles.groupedHeader}>
                    <div style={styles.groupedEmail}>
                      <strong>{item.email}</strong>
                    </div>
                    <span style={styles.attemptCount}>
                      {item.attempts} attempt{item.attempts !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div style={styles.warningBar}>
                    <div style={{
                      ...styles.warningFill,
                      width: `${Math.min((item.attempts / 10) * 100, 100)}%`,
                      backgroundColor: item.attempts > 5 ? '#e74c3c' : '#f39c12',
                    }} />
                  </div>

                  {item.attempts > 5 && (
                    <div style={styles.alertMessage}>
                      ⚠️ High number of failed attempts - possible brute force attack
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (window.confirm(`Block IPs associated with ${item.email}?`)) {
                        alert('This would block all IPs used by this email');
                      }
                    }}
                    style={styles.blockButton}
                  >
                    🚫 Block Associated IPs
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
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
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '18px',
    fontWeight: '600',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  select: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px',
    backgroundColor: 'white',
  },
  viewToggle: {
    display: 'flex',
    gap: '5px',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  toggleButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
    color: 'white',
    '&:hover': {
      backgroundColor: '#5a6fd8',
    },
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
  emailCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  email: {
    fontWeight: '500',
  },
  userTag: {
    fontSize: '11px',
    color: '#667eea',
  },
  ipCode: {
    padding: '2px 4px',
    backgroundColor: '#f0f0f0',
    borderRadius: '3px',
    fontFamily: 'monospace',
  },
  statusBadge: {
    padding: '3px 6px',
    borderRadius: '3px',
    fontSize: '11px',
    color: 'white',
    display: 'inline-block',
    marginRight: '5px',
  },
  failureReason: {
    fontSize: '11px',
    color: '#999',
    fontStyle: 'italic',
  },
  userAgent: {
    fontSize: '11px',
    color: '#666',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  groupedContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px',
  },
  groupedCard: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  groupedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  groupedEmail: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  attemptCount: {
    padding: '3px 8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
  },
  warningBar: {
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  warningFill: {
    height: '100%',
    transition: 'width 0.3s',
  },
  alertMessage: {
    padding: '8px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '4px',
    fontSize: '12px',
    marginBottom: '10px',
  },
  blockButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
};

export default LoginAttempts;