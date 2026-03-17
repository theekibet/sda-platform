// src/pages/members/Discover.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groupsService } from '../../services/groupsService';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../../components/common/Avatar';
import { formatDistanceToNow } from 'date-fns';

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  // UPDATED: Changed from flat array to object with sections
  const [discoverSections, setDiscoverSections] = useState({
    forYou: [],
    popularInYourCountry: [],
    trending: [],
    newGroups: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoverData();
  }, []);

  const fetchDiscoverData = async () => {
    setLoading(true);
    try {
      const [trendingRes, groupsRes, suggestionsRes] = await Promise.all([
        groupsService.getTrendingDiscussions(),
        user ? groupsService.getMyGroupsWithStats() : Promise.resolve({ data: [] }),
        groupsService.getDiscoverGroups(),
      ]);

      setTrending(trendingRes.data || []);
      setMyGroups(groupsRes.data || []);
      // UPDATED: Store the full object structure
      setDiscoverSections(suggestionsRes.data || {
        forYou: [],
        popularInYourCountry: [],
        trending: [],
        newGroups: [],
      });
    } catch (error) {
      console.error('Error fetching discover data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupsService.joinGroup(groupId);
      fetchDiscoverData();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleDiscussionClick = (post) => {
    if (post.requiresJoin && !user) {
      navigate('/login');
    } else if (post.requiresJoin) {
      handleJoinGroup(post.groupId);
    } else {
      navigate(`/groups/${post.groupId}/discussion/${post.id}`);
    }
  };

  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // Helper component for group cards
  const GroupCard = ({ group }) => (
    <div style={styles.groupCard}>
      <div style={styles.groupHeader}>
        <span style={styles.groupCategory}>{group.category}</span>
        {group.isPrivate && <span style={styles.privateBadge}>🔒 Private</span>}
      </div>
      <h3 style={styles.groupName}>{group.name}</h3>
      <p style={styles.groupDescription}>
        {group.description?.length > 100
          ? group.description.substring(0, 100) + '...'
          : group.description}
      </p>
      <div style={styles.groupMeta}>
        <span style={styles.memberCount}>👥 {group.memberCount} members</span>
        {group.meetingType && (
          <span style={styles.meetingType}>
            {group.meetingType === 'online' && '💻 Online'}
            {group.meetingType === 'in-person' && '🤝 In-Person'}
            {group.meetingType === 'hybrid' && '🔄 Hybrid'}
          </span>
        )}
      </div>
      <div style={styles.groupFooter}>
        <span style={styles.memberCount}>💬 {group.discussionCount || 0} discussions</span>
        {user ? (
          <button 
            onClick={() => handleJoinGroup(group.id)}
            style={styles.joinButton}
          >
            Join
          </button>
        ) : (
          <Link to="/login" style={styles.joinButton}>
            Login to Join
          </Link>
        )}
      </div>
    </div>
  );

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Trending Discussions */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🔥 Trending Discussions</h2>
        <div style={styles.trendingList}>
          {trending.slice(0, 5).map(post => (
            <div 
              key={post.id} 
              style={styles.trendingCard}
              onClick={() => handleDiscussionClick(post)}
            >
              <div style={styles.trendingContent}>
                <div style={styles.trendingHeader}>
                  <span style={styles.groupBadge}>
                    {post.group?.name}
                    {post.group?.isPrivate && ' 🔒'}
                  </span>
                  <span style={styles.replyCount}>💬 {post.replyCount || 0}</span>
                </div>
                <h4 style={styles.trendingTitle}>{post.title}</h4>
                <p style={styles.trendingPreview}>
                  {post.content?.substring(0, 100)}...
                </p>
                {post.requiresJoin ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(post.groupId);
                    }}
                    style={styles.joinToViewButton}
                  >
                    Join to view full discussion
                  </button>
                ) : (
                  <div style={styles.trendingMeta}>
                    <span>👤 {post.author?.name || 'Anonymous'}</span>
                    <span>· {formatTime(post.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Your Groups */}
      {user && myGroups.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📌 Your Groups</h2>
          <div style={styles.groupsGrid}>
            {myGroups.map(group => (
              <div key={group.id} style={styles.groupCard}>
                <div style={styles.groupHeader}>
                  <span style={styles.groupCategory}>{group.category}</span>
                  {group.newDiscussions > 0 && (
                    <span style={styles.newBadge}>{group.newDiscussions} new</span>
                  )}
                </div>
                <h3 style={styles.groupName}>
                  <Link to={`/groups/${group.id}`} style={styles.groupLink}>
                    {group.name}
                  </Link>
                </h3>
                <p style={styles.groupDescription}>{group.description}</p>
                <div style={styles.groupFooter}>
                  <span style={styles.memberCount}>👥 {group.memberCount} members</span>
                  <Link to={`/groups/${group.id}`} style={styles.viewButton}>
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* UPDATED: Discover Groups - Now shows 4 personalized sections */}
      
      {/* For You Section */}
      {discoverSections.forYou && discoverSections.forYou.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>✨ For You</h2>
          <p style={styles.sectionSubtitle}>Based on your interests</p>
          <div style={styles.groupsGrid}>
            {discoverSections.forYou.slice(0, 4).map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* Popular in Your Country */}
      {discoverSections.popularInYourCountry && discoverSections.popularInYourCountry.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🇰🇪 Popular in Kenya</h2>
          <p style={styles.sectionSubtitle}>Groups other Kenyans love</p>
          <div style={styles.groupsGrid}>
            {discoverSections.popularInYourCountry.slice(0, 4).map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Groups */}
      {discoverSections.trending && discoverSections.trending.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔥 Trending Groups</h2>
          <p style={styles.sectionSubtitle}>Most active groups this week</p>
          <div style={styles.groupsGrid}>
            {discoverSections.trending.slice(0, 4).map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* New Groups */}
      {discoverSections.newGroups && discoverSections.newGroups.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🆕 New Groups</h2>
          <p style={styles.sectionSubtitle}>Recently created, still growing</p>
          <div style={styles.groupsGrid}>
            {discoverSections.newGroups.slice(0, 4).map(group => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* Fallback if no sections have data */}
      {!discoverSections.forYou?.length && 
       !discoverSections.popularInYourCountry?.length && 
       !discoverSections.trending?.length && 
       !discoverSections.newGroups?.length && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🔍 Discover Groups</h2>
          <div style={styles.emptyState}>
            <p>No groups available yet. Be the first to create one!</p>
            <Link to="/groups" style={styles.createButton}>
              Create a Group
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '8px',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px',
    marginTop: '-5px',
  },
  trendingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  trendingCard: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateX(5px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
  trendingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  groupBadge: {
    fontSize: '12px',
    color: '#667eea',
    backgroundColor: '#f0f4ff',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  replyCount: {
    fontSize: '12px',
    color: '#999',
  },
  trendingTitle: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '16px',
    fontWeight: '600',
  },
  trendingPreview: {
    margin: '0 0 8px 0',
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.5',
  },
  trendingMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#999',
    marginTop: '8px',
  },
  joinToViewButton: {
    padding: '6px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '8px',
  },
  groupsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  groupCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
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
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  newBadge: {
    backgroundColor: '#fbbf24',
    color: '#333',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  privateBadge: {
    backgroundColor: '#e2e8f0',
    color: '#666',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
  },
  groupName: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    color: '#333',
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
    marginBottom: '10px',
    fontSize: '12px',
    color: '#999',
  },
  meetingType: {
    fontSize: '12px',
    color: '#667eea',
  },
  groupFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  memberCount: {
    fontSize: '13px',
    color: '#999',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#667eea',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontSize: '13px',
  },
  joinButton: {
    padding: '6px 12px',
    backgroundColor: '#48bb78',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'none',
  },
  groupLink: {
    color: 'inherit',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  createButton: {
    display: 'inline-block',
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontSize: '14px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
};

export default Discover;