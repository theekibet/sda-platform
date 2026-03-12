// src/pages/members/groups/GroupsList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getGroups, joinGroup, getMyGroups } from '../../../services/api';
import { GROUP_CATEGORIES, getCategoryIcon, getCategoryLabel } from '../../../utils/groupCategories';
import CreateGroup from './CreateGroup';
import PropTypes from 'prop-types';

function GroupsList({ onViewGroup }) {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    location: '',
  });
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchGroups();
    } else if (activeTab === 'my-groups') {
      fetchMyGroups();
    }
  }, [filters, activeTab]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;
      
      const response = await getGroups(params);
      setGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    setLoading(true);
    try {
      const response = await getMyGroups();
      setMyGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await joinGroup(groupId);
      alert('Request sent! The group admin will review your request.');
      fetchGroups();
      fetchMyGroups();
    } catch (error) {
      alert('Error joining group');
    }
  };

  const handleViewGroup = (groupId) => {
    if (onViewGroup) {
      onViewGroup(groupId); // Call the parent function
    } else {
      window.location.href = `/groups/${groupId}`; // Fallback navigation
    }
  };

  const categories = GROUP_CATEGORIES;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🤝 Fellowship Circles</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          style={styles.createButton}
        >
          + Create Group
        </button>
      </div>

      {/* Create Group Modal */}
      {showCreateForm && (
        <CreateGroup
          onClose={() => setShowCreateForm(false)}
          onGroupCreated={() => {
            setShowCreateForm(false);
            fetchGroups();
            fetchMyGroups();
          }}
        />
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('discover')}
          style={{
            ...styles.tab,
            ...(activeTab === 'discover' ? styles.activeTab : {}),
          }}
        >
          🔍 Discover Groups
        </button>
        <button
          onClick={() => setActiveTab('my-groups')}
          style={{
            ...styles.tab,
            ...(activeTab === 'my-groups' ? styles.activeTab : {}),
          }}
        >
          👥 My Groups
        </button>
      </div>

      {/* Filters - Only show on Discover tab */}
      {activeTab === 'discover' && (
        <div style={styles.filters}>
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            style={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search groups..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            style={styles.filterInput}
          />

          <input
            type="text"
            placeholder="Location (e.g., Nairobi)"
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            style={styles.filterInput}
          />
        </div>
      )}

      {/* Category Quick Filters */}
      {activeTab === 'discover' && (
        <div style={styles.categoryQuickFilters}>
          <button
            onClick={() => {
              setSelectedCategory('');
              setFilters({...filters, category: ''});
            }}
            style={{
              ...styles.categoryChip,
              ...(!selectedCategory ? styles.categoryChipActive : {}),
            }}
          >
            All
          </button>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat.value}
              onClick={() => {
                setSelectedCategory(cat.value);
                setFilters({...filters, category: cat.value});
              }}
              style={{
                ...styles.categoryChip,
                ...(selectedCategory === cat.value ? styles.categoryChipActive : {}),
              }}
            >
              {cat.icon} {cat.label.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Groups Grid */}
      {loading ? (
        <div style={styles.loading}>Loading groups...</div>
      ) : (
        <div style={styles.groupsGrid}>
          {(activeTab === 'discover' ? groups : myGroups).length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>
                {activeTab === 'discover' 
                  ? 'No groups found. Be the first to create one!' 
                  : 'You haven\'t joined any groups yet.'}
              </p>
            </div>
          ) : (
            (activeTab === 'discover' ? groups : myGroups).map(group => (
              <div key={group.id} style={styles.groupCard}>
                <div style={styles.groupHeader}>
                  <span style={styles.groupCategory}>
                    {getCategoryIcon(group.category)} {getCategoryLabel(group.category)}
                  </span>
                  {group.isPrivate && (
                    <span style={styles.privateBadge}>🔒 Private</span>
                  )}
                </div>
                
                <h3 style={styles.groupName}>{group.name}</h3>
                <p style={styles.groupDescription}>
                  {group.description.length > 100
                    ? group.description.substring(0, 100) + '...'
                    : group.description}
                </p>
                
                <div style={styles.groupMeta}>
                  <span style={styles.groupMetaItem}>
                    👥 {group.memberCount} members
                  </span>
                  {group.location && (
                    <span style={styles.groupMetaItem}>
                      📍 {group.location}
                    </span>
                  )}
                  <span style={styles.groupMetaItem}>
                    💬 {group.discussionCount || 0} discussions
                  </span>
                </div>

                <div style={styles.groupFooter}>
                  <span style={styles.groupCreator}>
                    Created by {group.createdBy?.name}
                  </span>
                  
                  {activeTab === 'discover' ? (
                    group.userMembership ? (
                      group.userMembership.status === 'pending' ? (
                        <span style={styles.pendingBadge}>⏳ Pending Approval</span>
                      ) : (
                        <button
                          onClick={() => handleViewGroup(group.id)}
                          style={styles.viewButton}
                        >
                          View Group
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        style={styles.joinButton}
                      >
                        Join Group
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleViewGroup(group.id)}
                      style={styles.viewButton}
                    >
                      View Group
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Make prop optional with PropTypes
GroupsList.propTypes = {
  onViewGroup: PropTypes.func  // Removed .isRequired to make it optional
};

// Add default prop
GroupsList.defaultProps = {
  onViewGroup: null
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '28px',
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  activeTab: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginBottom: '20px',
  },
  filterSelect: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  filterInput: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  categoryQuickFilters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  categoryChip: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
    color: 'white',
    borderColor: '#667eea',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  emptyText: {
    color: '#999',
    fontSize: '16px',
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  groupCategory: {
    fontSize: '12px',
    color: '#667eea',
    backgroundColor: '#f0f4ff',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  privateBadge: {
    fontSize: '11px',
    color: '#f59e0b',
    backgroundColor: '#fff3e0',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  groupName: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '18px',
  },
  groupDescription: {
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '15px',
    flex: 1,
  },
  groupMeta: {
    display: 'flex',
    gap: '12px',
    marginBottom: '15px',
    fontSize: '12px',
    color: '#999',
    flexWrap: 'wrap',
  },
  groupMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  groupFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '15px',
  },
  groupCreator: {
    fontSize: '12px',
    color: '#999',
  },
  joinButton: {
    padding: '6px 12px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  pendingBadge: {
    padding: '6px 12px',
    backgroundColor: '#ffc107',
    color: '#333',
    borderRadius: '4px',
    fontSize: '12px',
  },
};

export default GroupsList;