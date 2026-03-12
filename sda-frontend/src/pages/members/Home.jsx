// src/pages/members/Home.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getForumPosts, getLocationStats } from '../../services/api';
function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, statsRes] = await Promise.all([
        getForumPosts(),
        user?.city ? getLocationStats(user.city) : Promise.resolve({ data: null })
      ]);
      setPosts(postsRes.data);
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
          <span style={styles.statValue}>{posts.length}</span>
          <span style={styles.statLabel}>Forum Posts</span>
        </div>
        {stats && (
          <div style={styles.statCard}>
            <span style={styles.statValue}>{stats.members}</span>
            <span style={styles.statLabel}>Youth in {user?.city}</span>
          </div>
        )}
      </div>

      {/* Recent Forum Posts */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Discussions</h2>
        {posts.length === 0 ? (
          <p style={styles.emptyText}>No posts yet. Be the first to start a discussion!</p>
        ) : (
          <div style={styles.postsList}>
            {posts.slice(0, 5).map(post => (
              <div key={post.id} style={styles.postCard}>
                <div style={styles.postHeader}>
                  <h3 style={styles.postTitle}>{post.title}</h3>
                  {post.isAnonymous ? (
                    <span style={styles.anonymousBadge}>Anonymous</span>
                  ) : (
                    <span style={styles.authorName}>{post.author?.name}</span>
                  )}
                </div>
                <p style={styles.postPreview}>
                  {post.content.substring(0, 150)}...
                </p>
                <div style={styles.postMeta}>
                  <span>💬 {post._count?.replies || 0} replies</span>
                  <span>📍 {post.location || 'No location'}</span>
                  <span>🕐 {new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionGrid}>
          <button style={styles.actionButton} onClick={() => window.location.href = '/forum'}>
            📝 Start Discussion
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
  postsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  postCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  postTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  anonymousBadge: {
    backgroundColor: '#9b59b6',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  authorName: {
    color: '#667eea',
    fontSize: '14px',
  },
  postPreview: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  postMeta: {
    display: 'flex',
    gap: '20px',
    fontSize: '13px',
    color: '#999',
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
  },
};

export default Home;