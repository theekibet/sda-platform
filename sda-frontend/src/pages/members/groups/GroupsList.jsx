// src/pages/members/groups/GroupsList.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { groupsService } from '../../../services/groupsService';
import { GROUP_CATEGORIES, getCategoryIcon, getCategoryLabel } from '../../../utils/groupCategories';
import CreateGroup from './CreateGroup';
import { useNavigate } from 'react-router-dom';
import './Group.css';

function GroupsList({ onViewGroup = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [discoverSections, setDiscoverSections] = useState({
    forYou: [],
    popularInYourCountry: [],
    trending: [],
    newGroups: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    location: '',
    meetingType: '',
    sort: 'popular',
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    fetchMyGroups();
    if (activeTab === 'discover') {
      fetchDiscoverGroups();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchGroups();
    }
  }, [filters, activeTab]);

  // Refresh my groups periodically to update unread counts
  useEffect(() => {
    if (activeTab === 'my-groups') {
      const interval = setInterval(() => {
        fetchMyGroups();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
      };
      
      const response = await groupsService.getGroups(params);
      const groupsData = response.data?.data || response.data || [];
      setGroups(groupsData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await groupsService.getMyGroups();
      const groupsData = response.data?.data || response.data || [];
      setMyGroups(groupsData);
    } catch (error) {
      console.error('Error fetching my groups:', error);
    }
  };

  const fetchDiscoverGroups = async () => {
    try {
      const response = await groupsService.getDiscoverGroups();
      const data = response.data?.data || response.data || {
        forYou: [],
        popularInYourCountry: [],
        trending: [],
        newGroups: [],
      };
      setDiscoverSections(data);
    } catch (error) {
      console.error('Error fetching discover groups:', error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    if (!groupId) {
      console.error('Cannot join group: No group ID provided');
      return;
    }
    
    try {
      await groupsService.joinGroup(groupId);
      alert('Request sent! The group admin will review your request.');
      fetchGroups();
      fetchMyGroups();
      fetchDiscoverGroups();
    } catch (error) {
      alert(error.response?.data?.message || 'Error joining group');
    }
  };

  const handleViewGroup = (groupId) => {
    if (!groupId) {
      console.error('Cannot view group: Group ID is undefined');
      return;
    }
    
    setTimeout(() => {
      if (onViewGroup) {
        onViewGroup(groupId);
      } else {
        navigate(`/groups/${groupId}`);
      }
    }, 0);
  };

  // Separate General Discussion from other groups
  const generalGroup = myGroups.find(g => g.name === 'General Discussion' || g.isDefault);
  const otherMyGroups = myGroups.filter(g => !(g.name === 'General Discussion' || g.isDefault));

  const categories = GROUP_CATEGORIES;

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    }
    if (diffMinutes < 2880) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading && activeTab === 'discover' && groups.length === 0) {
    return <div className="groups-loading">Loading groups...</div>;
  }

  return (
    <div className="groups-container">
      {/* Header */}
      <div className="groups-header">
        <h2 className="groups-title">🤝 Fellowship Circles</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="groups-create-button"
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
            fetchDiscoverGroups();
          }}
        />
      )}

      {/* Tabs */}
      <div className="groups-tabs">
        <button
          onClick={() => setActiveTab('discover')}
          className={`groups-tab ${activeTab === 'discover' ? 'groups-tab-active' : ''}`}
        >
          🔍 Discover Groups
        </button>
        <button
          onClick={() => {
            setActiveTab('my-groups');
            fetchMyGroups();
          }}
          className={`groups-tab ${activeTab === 'my-groups' ? 'groups-tab-active' : ''}`}
        >
          👥 My Groups
          {myGroups.reduce((total, group) => total + (group.unreadCount || 0), 0) > 0 && (
            <span style={styles.totalUnreadBadge}>
              {myGroups.reduce((total, group) => total + (group.unreadCount || 0), 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters - Only show on Discover tab */}
      {activeTab === 'discover' && (
        <div className="groups-filters">
          <select
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
            className="groups-filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          <select
            value={filters.meetingType}
            onChange={(e) => setFilters({...filters, meetingType: e.target.value})}
            className="groups-filter-select"
          >
            <option value="">All Meeting Types</option>
            <option value="online">💻 Online Only</option>
            <option value="in-person">🤝 In-Person Only</option>
            <option value="hybrid">🔄 Hybrid</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters({...filters, sort: e.target.value})}
            className="groups-filter-select"
          >
            <option value="popular">⭐ Most Popular</option>
            <option value="new">🆕 Newest</option>
            <option value="active">🔥 Most Active</option>
          </select>

          <input
            type="text"
            placeholder="Search groups..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            className="groups-filter-input"
          />

          <input
            type="text"
            placeholder="Location (optional)"
            value={filters.location}
            onChange={(e) => setFilters({...filters, location: e.target.value})}
            className="groups-filter-input"
          />
        </div>
      )}

      {/* Category Quick Filters */}
      {activeTab === 'discover' && (
        <div className="groups-category-quick-filters">
          <button
            onClick={() => {
              setSelectedCategory('');
              setFilters({...filters, category: ''});
            }}
            className={`groups-category-chip ${!selectedCategory ? 'groups-category-chip-active' : ''}`}
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
              className={`groups-category-chip ${selectedCategory === cat.value ? 'groups-category-chip-active' : ''}`}
            >
              {cat.icon} {cat.label.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Groups Grid */}
      <div className="groups-grid">
        {activeTab === 'my-groups' ? (
          <>
            {/* General Discussion (always first) */}
            {generalGroup && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">📢 Community Hub</h3>
                <GroupCard
                  group={generalGroup}
                  isMember={true}
                  onView={() => handleViewGroup(generalGroup.id)}
                  showLastMessage={true}
                />
              </div>
            )}

            {/* Other Groups */}
            {otherMyGroups.length > 0 && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">👥 Your Groups</h3>
                <div className="groups-sub-grid">
                  {otherMyGroups.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={true}
                      onView={() => handleViewGroup(group.id)}
                      showLastMessage={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {!generalGroup && otherMyGroups.length === 0 && (
              <div className="groups-empty-state">
                <p className="groups-empty-text">You haven't joined any groups yet.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="groups-create-button"
                  style={{ marginTop: '15px' }}
                >
                  🔍 Discover Groups
                </button>
              </div>
            )}
          </>
        ) : (
          /* Discover Tab - Smart Recommendations */
          <>
            {/* FOR YOU Section */}
            {discoverSections.forYou && discoverSections.forYou.length > 0 && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">✨ For You</h3>
                <p style={styles.sectionSubtitle}>
                  Based on your interests
                </p>
                <div className="groups-sub-grid">
                  {discoverSections.forYou.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={false}
                      onJoin={() => handleJoinGroup(group.id)}
                      onView={() => handleViewGroup(group.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* POPULAR IN YOUR COUNTRY Section */}
            {discoverSections.popularInYourCountry && discoverSections.popularInYourCountry.length > 0 && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">🇰🇪 Popular in Kenya</h3>
                <p style={styles.sectionSubtitle}>
                  Groups other Kenyans love
                </p>
                <div className="groups-sub-grid">
                  {discoverSections.popularInYourCountry.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={false}
                      onJoin={() => handleJoinGroup(group.id)}
                      onView={() => handleViewGroup(group.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TRENDING Section */}
            {discoverSections.trending && discoverSections.trending.length > 0 && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">🔥 Trending Now</h3>
                <p style={styles.sectionSubtitle}>
                  Most active groups this week
                </p>
                <div className="groups-sub-grid">
                  {discoverSections.trending.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={false}
                      onJoin={() => handleJoinGroup(group.id)}
                      onView={() => handleViewGroup(group.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* NEW GROUPS Section */}
            {discoverSections.newGroups && discoverSections.newGroups.length > 0 && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">🆕 New Groups</h3>
                <p style={styles.sectionSubtitle}>
                  Recently created, still growing
                </p>
                <div className="groups-sub-grid">
                  {discoverSections.newGroups.map(group => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={false}
                      onJoin={() => handleJoinGroup(group.id)}
                      onView={() => handleViewGroup(group.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Groups (filtered) */}
            {(filters.search || filters.category || filters.location || filters.meetingType) && (
              <div className="groups-special-section">
                <h3 className="groups-special-title">🔍 Search Results</h3>
                {groups.length === 0 ? (
                  <div className="groups-empty-state">
                    <p className="groups-empty-text">No groups found matching your filters.</p>
                  </div>
                ) : (
                  <div className="groups-sub-grid">
                    {groups.map(group => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        isMember={false}
                        onJoin={() => handleJoinGroup(group.id)}
                        onView={() => handleViewGroup(group.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state when no recommendations */}
            {!discoverSections.forYou?.length && 
             !discoverSections.popularInYourCountry?.length && 
             !discoverSections.trending?.length && 
             !discoverSections.newGroups?.length &&
             !filters.search && !filters.category && !filters.location && !filters.meetingType && (
              <div className="groups-empty-state">
                <p className="groups-empty-text">No groups available yet. Be the first to create one!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Enhanced GroupCard component
const GroupCard = ({ group, isMember, onJoin, onView, showLastMessage = false }) => {
  // Ensure group has an id before rendering
  if (!group || !group.id) {
    console.error('GroupCard: Invalid group object', group);
    return null;
  }

  const userMembership = group.userMembership;
  const hasUnread = group.unreadCount > 0;

  const handleViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onView && group.id) {
      onView();
    }
  };

  const handleJoinClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onJoin && group.id) {
      onJoin();
    }
  };

  const getMeetingTypeBadge = () => {
    if (!group.meetingType) return null;
    
    const badges = {
      online: '💻 Online',
      'in-person': '🤝 In-Person',
      hybrid: '🔄 Hybrid',
    };
    
    return badges[group.meetingType] || null;
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return `${hours}h ago`;
    }
    if (diffMinutes < 2880) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div 
      className="group-card"
      style={{
        ...(hasUnread ? styles.groupCardUnread : {}),
        cursor: 'pointer',
      }}
      onClick={handleViewClick}
    >
      <div className="group-card-header">
        <span className="group-card-category">
          {getCategoryIcon(group.category)} {getCategoryLabel(group.category)}
        </span>
        {group.isPrivate && (
          <span className="group-card-private-badge">🔒 Private</span>
        )}
      </div>
      
      <h3 className="group-card-name">
        {group.name}
        {hasUnread && (
          <span style={styles.unreadBadge}>
            {group.unreadCount > 99 ? '99+' : group.unreadCount}
          </span>
        )}
      </h3>
      
      <p className="group-card-description">
        {group.description?.length > 100
          ? group.description.substring(0, 100) + '...'
          : group.description}
      </p>
      
      {/* Last message preview for my groups */}
      {showLastMessage && group.lastMessage && (
        <div style={styles.lastMessagePreview}>
          <span style={styles.lastMessageAuthor}>
            {group.lastMessage.author?.name}:
          </span>
          <span style={styles.lastMessageContent}>
            {group.lastMessage.content?.length > 30
              ? group.lastMessage.content.substring(0, 30) + '...'
              : group.lastMessage.content}
          </span>
          <span style={styles.lastMessageTime}>
            {formatLastMessageTime(group.lastMessage.createdAt)}
          </span>
        </div>
      )}
      
      <div className="group-card-meta">
        <span className="group-card-meta-item">
          👥 {group.memberCount || 0} members
        </span>
        {getMeetingTypeBadge() && (
          <span className="group-card-meta-item">
            {getMeetingTypeBadge()}
          </span>
        )}
        {group.location && group.meetingType !== 'online' && (
          <span className="group-card-meta-item">
            📍 {group.location}
          </span>
        )}
        <span className="group-card-meta-item">
          💬 {group.messageCount || group.discussionCount || 0} messages
        </span>
        {group.lastMessageAt && (
          <span className="group-card-meta-item">
            🕐 Last message {formatLastMessageTime(group.lastMessageAt)}
          </span>
        )}
      </div>

      <div className="group-card-footer">
        <span className="group-card-creator">
          Created by {group.createdBy?.name}
        </span>
        
        {isMember ? (
          <button
            onClick={handleViewClick}
            className="group-card-view-button"
          >
            View Group
          </button>
        ) : (
          userMembership ? (
            userMembership.status === 'pending' ? (
              <span className="group-card-pending-badge">⏳ Pending</span>
            ) : (
              <button onClick={handleViewClick} className="group-card-view-button">
                View Group
              </button>
            )
          ) : (
            <button 
              onClick={handleJoinClick} 
              className="group-card-join-button"
            >
              Join Group
            </button>
          )
        )}
      </div>
    </div>
  );
};

// Additional styles
const styles = {
  sectionSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  groupCardUnread: {
    border: '2px solid #667eea',
    backgroundColor: '#f0f4ff',
  },
  unreadBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    backgroundColor: '#ff4444',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  totalUnreadBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    backgroundColor: '#ff4444',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '11px',
    fontWeight: '600',
  },
  lastMessagePreview: {
    backgroundColor: '#f5f5f5',
    padding: '8px 12px',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '12px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  lastMessageAuthor: {
    fontWeight: '600',
    color: '#667eea',
  },
  lastMessageContent: {
    color: '#666',
    flex: 1,
  },
  lastMessageTime: {
    color: '#999',
    fontSize: '10px',
    alignSelf: 'center',
  },
};

export default GroupsList;