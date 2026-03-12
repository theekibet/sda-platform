// src/pages/admin/security/IPBlocking.jsx
import React, { useState, useEffect } from 'react';
import { getBlockedIPs, blockIP, unblockIP } from '../../../services/api';

const IPBlocking = () => {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIP, setNewIP] = useState({
    ipAddress: '',
    reason: '',
    expiresAt: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchBlockedIPs();
  }, [pagination.page]);

  const fetchBlockedIPs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getBlockedIPs({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setIps(response.data.ips || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blocked IPs');
      console.error('Error fetching blocked IPs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (e) => {
    e.preventDefault();
    
    if (!newIP.ipAddress) {
      setError('IP address is required');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await blockIP(newIP.ipAddress, {
        reason: newIP.reason,
        expiresAt: newIP.expiresAt || undefined,
      });
      
      setSuccess(`IP ${newIP.ipAddress} has been blocked`);
      setShowAddForm(false);
      setNewIP({ ipAddress: '', reason: '', expiresAt: '' });
      fetchBlockedIPs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to block IP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockIP = async (ipAddress) => {
    if (!window.confirm(`Are you sure you want to unblock ${ipAddress}?`)) {
      return;
    }
    
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await unblockIP(ipAddress);
      setSuccess(`IP ${ipAddress} has been unblocked`);
      fetchBlockedIPs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unblock IP');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading && ips.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading blocked IPs...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>🚫 IP Blocking</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          {showAddForm ? 'Cancel' : '+ Block IP'}
        </button>
      </div>

      <p style={styles.description}>
        Block malicious IP addresses from accessing your platform.
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

      {/* Add IP Form */}
      {showAddForm && (
        <form onSubmit={handleBlockIP} style={styles.form}>
          <h4 style={styles.formTitle}>Block New IP Address</h4>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>IP Address *</label>
            <input
              type="text"
              value={newIP.ipAddress}
              onChange={(e) => setNewIP({...newIP, ipAddress: e.target.value})}
              placeholder="e.g., 192.168.1.1 or 203.0.113.0/24"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Reason</label>
            <input
              type="text"
              value={newIP.reason}
              onChange={(e) => setNewIP({...newIP, reason: e.target.value})}
              placeholder="Why is this IP being blocked?"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Expires At (optional)</label>
            <input
              type="datetime-local"
              value={newIP.expiresAt}
              onChange={(e) => setNewIP({...newIP, expiresAt: e.target.value})}
              style={styles.input}
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              style={{
                ...styles.submitButton,
                ...(actionLoading ? styles.buttonDisabled : {}),
              }}
            >
              {actionLoading ? 'Blocking...' : 'Block IP'}
            </button>
          </div>
        </form>
      )}

      {/* IP List */}
      {ips.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🛡️</div>
          <h4 style={styles.emptyTitle}>No Blocked IPs</h4>
          <p style={styles.emptyText}>All IP addresses are currently allowed.</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Reason</th>
                <th>Blocked By</th>
                <th>Blocked At</th>
                <th>Expires</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ips.map(ip => {
                const expired = isExpired(ip.expiresAt);
                
                return (
                  <tr key={ip.id} style={expired ? styles.expiredRow : {}}>
                    <td>
                      <code style={styles.ipCode}>{ip.ipAddress}</code>
                    </td>
                    <td>{ip.reason || '—'}</td>
                    <td>{ip.blockedBy?.name || 'System'}</td>
                    <td>{formatDate(ip.createdAt)}</td>
                    <td>{formatDate(ip.expiresAt)}</td>
                    <td>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: expired ? '#95a5a6' : '#e74c3c',
                      }}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleUnblockIP(ip.ipAddress)}
                        disabled={actionLoading}
                        style={styles.unblockButton}
                        title="Unblock IP"
                      >
                        🔓 Unblock
                      </button>
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
  addButton: {
    padding: '6px 12px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#c0392b',
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
  form: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  formTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '16px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '2px solid #e0e0e0',
    fontSize: '13px',
    '&:focus': {
      outline: 'none',
      borderColor: '#667eea',
    },
  },
  formActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
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
  expiredRow: {
    opacity: 0.6,
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
  },
  unblockButton: {
    padding: '4px 8px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: '11px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#2980b9',
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
};

export default IPBlocking;