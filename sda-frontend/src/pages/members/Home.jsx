// src/pages/members/Home.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getLocationStats } from '../../services/api';
import { groupsService } from '../../services/groupsService';

function Home() {
  const { user } = useAuth();
  const [recentDiscussions, setRecentDiscussions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch recent discussions from groups (instead of forum)
      const [discussionsRes, statsRes] = await Promise.all([
        groupsService.getTrendingDiscussions(),
        user?.city ? getLocationStats(user.city) : Promise.resolve({ data: null })
      ]);
      
      setRecentDiscussions(discussionsRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Welcome Section */}
      <div style={styles.welcomeCard}>
        <h1 style={styles.welcomeTitle}>Welcome back, {user?.name}! 👋</h1>
        <p style={styles.welcomeText}>
          {user?.city ? `You're in ${user.city}` : 'Set your location to find youth near you'}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{recentDiscussions.length}</span>
          <span style={styles.statLabel}>Recent Discussions</span>
        </div>
        {stats && (
          <div style={styles.statCard}>
            <span style={styles.statValue}>{stats.members}</span>
            <span style={styles.statLabel}>Youth in {user?.city}</span>
          </div>
        )}
      </div>

      {/* Trending Discussions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🔥 Trending Discussions</h2>
        {recentDiscussions.length === 0 ? (
          <p style={styles.emptyText}>No discussions yet. Be the first to start one!</p>
        ) : (
          <div style={styles.discussionsList}>
            {recentDiscussions.slice(0, 5).map(discussion => (
              <div 
                key={discussion.id} 
                style={styles.discussionCard}
                onClick={() => window.location.href = `/groups/${discussion.groupId}/discussion/${discussion.id}`}
              >
                <div style={styles.discussionHeader}>
                  <h3 style={styles.discussionTitle}>{discussion.title}</h3>
                  <span style={styles.groupBadge}>{discussion.group?.name || 'General'}</span>
                </div>
                <p style={styles.discussionPreview}>
                  {discussion.content?.substring(0, 150)}...
                </p>
                <div style={styles.discussionMeta}>
                  <span>💬 {discussion.replyCount || 0} replies</span>
                  <span>👤 {discussion.author?.name || 'Anonymous'}</span>
                  <span>🕐 {new Date(discussion.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={styles.viewAllLink}>
          <a href="/discover" style={styles.link}>View all discussions →</a>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionGrid}>
          <button style={styles.actionButton} onClick={() => window.location.href = '/discover'}>
            🔥 Discover Discussions
          </button>
          <button style={styles.actionButton} onClick={() => window.location.href = '/groups'}>
            👥 Browse Groups
          </button>
          <button style={styles.actionButton} onClick={() => window.location.href = '/location'}>
            📍 Find Youth Near Me
          </button>
          <button style={styles.actionButton} onClick={() => window.location.href = '/profile'}>
            👤 Update Profile
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#666',
  },
  welcomeCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  welcomeTitle: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '28px',
  },
  welcomeText: {
    margin: 0,
    color: '#666',
    fontSize: '16px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '22px',
    color: '#333',
    marginBottom: '20px',
  },
  emptyText: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    color: '#999',
  },
  discussionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  discussionCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  discussionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  discussionTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
    flex: 1,
  },
  groupBadge: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    marginLeft: '10px',
  },
  discussionPreview: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  discussionMeta: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#999',
    flexWrap: 'wrap',
  },
  viewAllLink: {
    textAlign: 'right',
    marginTop: '15px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  quickActions: {
    marginTop: '40px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  actionButton: {
    padding: '15px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background 0.3s',
    ':hover': {
      backgroundColor: '#5a6fd8',
    },
  },
};

export default Home;