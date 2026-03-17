// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getDashboardStats, 
  getUsers, 
  suspendUser,
  toggleAdmin,
  adminResetPassword,
  deleteUser,
} from '../../services/api';
import Avatar from '../../components/common/Avatar';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId, reason, duration) => {
    try {
      await suspendUser(userId, { reason, duration });
      fetchUsers();
      setShowConfirmDialog(false);
      alert('User suspended successfully');
    } catch (error) {
      alert('Error suspending user: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('⚠️ This action is irreversible. All user data will be permanently deleted. Continue?')) {
      try {
        await deleteUser(userId);
        fetchUsers();
        alert('User deleted successfully');
      } catch (error) {
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      await toggleAdmin(userId);
      fetchUsers();
      alert('Admin status updated');
    } catch (error) {
      alert('Error updating admin status: ' + error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new temporary password (min 8 characters):');
    if (newPassword && newPassword.length >= 8) {
      try {
        await adminResetPassword({ userId, newPassword });
        alert('Password reset successful');
      } catch (error) {
        alert('Error resetting password: ' + error.message);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatus = !filters.status || user.status === filters.status;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div style={styles.container}>
      {/* Welcome Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>👑 Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div>
              <h3 style={styles.statTitle}>Total Users</h3>
              <p style={styles.statNumber}>{stats.users.total}</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📝</div>
            <div>
              <h3 style={styles.statTitle}>Forum Posts</h3>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🙏</div>
            <div>
              <h3 style={styles.statTitle}>Prayer Requests</h3>
              <p style={styles.statNumber}>{stats.content.prayerRequests}</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🤝</div>
            <div>
              <h3 style={styles.statTitle}>Groups</h3>
              <p style={styles.statNumber}>{stats.content.groups}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>User Management</h2>
          <div style={styles.userFilters}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              style={styles.filterSelect}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              style={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <div style={styles.userTable}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={styles.userCell}>
                      <Avatar user={user} size="small" />
                      <div>
                        <div style={styles.userName}>{user.name}</div>
                        <div style={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.phone || '—'}</td>
                  <td>
                    <span style={{
                      ...styles.roleBadge,
                      ...(user.isAdmin ? styles.adminRole : {}),
                      ...(user.isModerator ? styles.moderatorRole : {})
                    }}>
                      {user.isAdmin ? 'Admin' : user.isModerator ? 'Moderator' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      ...styles.statusBadge,
                      ...(user.isSuspended ? styles.suspendedStatus : styles.activeStatus)
                    }}>
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        style={styles.viewButton}
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(user.id)}
                        style={styles.adminButton}
                        title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      >
                        {user.isAdmin ? '👑' : '⭐'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        style={styles.resetButton}
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => {
                          setConfirmAction({
                            type: 'suspend',
                            user: user,
                            onConfirm: (reason, duration) => handleSuspendUser(user.id, reason, duration)
                          });
                          setShowConfirmDialog(true);
                        }}
                        style={user.isSuspended ? styles.unsuspendButton : styles.suspendButton}
                        title={user.isSuspended ? 'Unsuspend' : 'Suspend'}
                      >
                        {user.isSuspended ? '✅' : '⛔'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={styles.deleteButton}
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div style={styles.modalOverlay} onClick={() => setShowUserModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>User Details</h2>
              <button onClick={() => setShowUserModal(false)} style={styles.closeButton}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.userProfileHeader}>
                <Avatar user={selectedUser} size="large" />
                <div>
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                </div>
              </div>

              <div style={styles.userInfoGrid}>
                <div style={styles.infoItem}>
                  <label>Phone</label>
                  <p>{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label>Location</label>
                  <p>{selectedUser.city || 'Not set'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label>Age</label>
                  <p>{selectedUser.age || 'Not provided'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label>Gender</label>
                  <p>{selectedUser.gender || 'Not specified'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label>Member Since</label>
                  <p>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedUser.isSuspended && (
                <div style={styles.suspensionInfo}>
                  <h4>Suspension Details</h4>
                  <p><strong>Reason:</strong> {selectedUser.suspensionReason}</p>
                  <p><strong>Until:</strong> {selectedUser.suspendedUntil ? new Date(selectedUser.suspendedUntil).toLocaleDateString() : 'Permanent'}</p>
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  onClick={() => handleToggleAdmin(selectedUser.id)}
                  style={styles.modalAdminButton}
                >
                  {selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}
                </button>
                <button
                  onClick={() => handleResetPassword(selectedUser.id)}
                  style={styles.modalResetButton}
                >
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setConfirmAction({
                      type: 'suspend',
                      user: selectedUser,
                      onConfirm: (reason, duration) => handleSuspendUser(selectedUser.id, reason, duration)
                    });
                    setShowConfirmDialog(true);
                  }}
                  style={selectedUser.isSuspended ? styles.modalUnsuspendButton : styles.modalSuspendButton}
                >
                  {selectedUser.isSuspended ? 'Unsuspend' : 'Suspend'}
                </button>
                <button
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  style={styles.modalDeleteButton}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div style={styles.modalOverlay} onClick={() => setShowConfirmDialog(false)}>
          <div style={styles.confirmDialog} onClick={e => e.stopPropagation()}>
            <h3>Confirm Action</h3>
            {confirmAction.type === 'suspend' && (
              <div>
                <p>Suspend {confirmAction.user.name}?</p>
                <div style={styles.formGroup}>
                  <label>Reason:</label>
                  <textarea
                    placeholder="Enter reason..."
                    style={styles.textarea}
                    rows="3"
                    id="suspendReason"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label>Duration:</label>
                  <select style={styles.select} id="suspendDuration">
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <div style={styles.confirmActions}>
                  <button
                    onClick={() => {
                      const reason = document.getElementById('suspendReason').value;
                      const duration = document.getElementById('suspendDuration').value;
                      if (reason) {
                        confirmAction.onConfirm(reason, duration);
                        setShowConfirmDialog(false);
                      }
                    }}
                    style={styles.confirmButton}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    margin: '0 0 5px 0',
    color: '#9b59b6',
    fontSize: '28px',
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statIcon: {
    fontSize: '32px',
  },
  statTitle: {
    margin: '0 0 5px 0',
    color: '#666',
    fontSize: '14px',
  },
  statNumber: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    color: '#333',
    fontSize: '20px',
  },
  userFilters: {
    display: 'flex',
    gap: '10px',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    width: '250px',
  },
  filterSelect: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  userTable: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userName: {
    fontWeight: '500',
    color: '#333',
  },
  userEmail: {
    fontSize: '12px',
    color: '#999',
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  adminRole: {
    backgroundColor: '#9b59b6',
    color: 'white',
  },
  moderatorRole: {
    backgroundColor: '#3498db',
    color: 'white',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  activeStatus: {
    backgroundColor: '#27ae60',
    color: 'white',
  },
  suspendedStatus: {
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  actionButtons: {
    display: 'flex',
    gap: '5px',
  },
  viewButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    backgroundColor: '#3498db',
    color: 'white',
  },
  adminButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    backgroundColor: '#9b59b6',
    color: 'white',
  },
  resetButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    backgroundColor: '#f39c12',
    color: 'white',
  },
  suspendButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    backgroundColor: '#e74c3c',
    color: 'white',
  },
  unsuspendButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    backgroundColor: '#27ae60',
    color: 'white',
  },
  deleteButton: {
    padding: '5px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    backgroundColor: '#c0392b',
    color: 'white',
  },
  // Modal Styles
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999',
  },
  modalBody: {
    padding: '20px',
  },
  userProfileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
  },
  userInfoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  infoItem: {
    '& label': {
      display: 'block',
      fontSize: '12px',
      color: '#999',
      marginBottom: '3px',
    },
    '& p': {
      margin: 0,
      fontWeight: '500',
    },
  },
  suspensionInfo: {
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  modalActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  modalAdminButton: {
    padding: '10px',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  modalResetButton: {
    padding: '10px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  modalSuspendButton: {
    padding: '10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  modalUnsuspendButton: {
    padding: '10px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  modalDeleteButton: {
    padding: '10px',
    backgroundColor: '#c0392b',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  confirmDialog: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '400px',
    width: '90%',
  },
  formGroup: {
    marginBottom: '15px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginTop: '5px',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    marginTop: '5px',
  },
  confirmActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  confirmButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default AdminDashboard;
