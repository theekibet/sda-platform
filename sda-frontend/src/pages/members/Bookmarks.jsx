// src/pages/members/Bookmarks.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InteractiveVerseCard from '../../components/bible/InteractiveVerseCard';

function Bookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/bible/verse/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setBookmarks(data.bookmarks || []);
      } else {
        setError('Failed to load bookmarks');
      }
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // This will be called when a bookmark is removed via the InteractiveVerseCard
  const handleBookmarkRemoved = (verseId) => {
    // Remove from local state immediately for better UX
    setBookmarks(prev => prev.filter(b => {
      const bookmarkVerseId = b.verse?.id || b.id;
      return bookmarkVerseId !== verseId;
    }));
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your bookmarks...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔖 My Bookmarks</h2>
        <p style={styles.subtitle}>
          {bookmarks.length} {bookmarks.length === 1 ? 'verse' : 'verses'} saved
        </p>
      </div>

      {error && (
        <div style={styles.error}>
          <span style={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}

      {bookmarks.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📖</div>
          <h3 style={styles.emptyTitle}>No Bookmarks Yet</h3>
          <p style={styles.emptyText}>
            Start building your collection of meaningful verses! When you bookmark verses 
            while reading, they'll appear here for easy access.
          </p>
          <div style={styles.emptyActions}>
            <button 
              onClick={() => window.location.href = '/bible/verse-of-day'}
              style={styles.primaryButton}
            >
              ✨ Today's Verse
            </button>
            <button 
              onClick={() => window.location.href = '/bible/reader'}
              style={styles.secondaryButton}
            >
              📖 Browse Bible
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.bookmarksList}>
          {bookmarks.map(bookmark => {
            // Extract verse data - handle different possible structures
            const verseData = bookmark.verse || bookmark;
            const verseId = verseData?.id;
            const bookmarkDate = bookmark.createdAt;

            return (
              <div key={bookmark.id} style={styles.bookmarkWrapper}>
                {/* Show when this was bookmarked */}
                <div style={styles.bookmarkMeta}>
                  <span style={styles.bookmarkDate}>
                    📅 Saved {new Date(bookmarkDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Use InteractiveVerseCard for full social features */}
                <InteractiveVerseCard 
                  verse={verseData}
                  showReadButton={true}
                  showSharedBy={false} // Don't show "shared by" in bookmarks
                  onBookmarkChange={() => handleBookmarkRemoved(verseId)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful Tips Section */}
      {bookmarks.length > 0 && (
        <div style={styles.tipsSection}>
          <h3 style={styles.tipsTitle}>💡 Tips</h3>
          <ul style={styles.tipsList}>
            <li>Click the 🔖 bookmark icon on any verse card to remove it from your collection</li>
            <li>Use the 💬 comment section to add your personal reflections</li>
            <li>Click 📖 Read to see the verse in its full chapter context</li>
            <li>Share meaningful verses with the community using the ❤️ like button</li>
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    paddingBottom: '60px',
  },
  header: {
    marginBottom: '30px',
    borderBottom: '2px solid #667eea',
    paddingBottom: '15px',
  },
  title: {
    color: '#333',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    color: '#666',
    fontSize: '16px',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    color: '#666',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#666',
  },
  error: {
    padding: '16px 20px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '8px',
    marginBottom: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    backgroundColor: '#f9f9f9',
    borderRadius: '16px',
    border: '2px dashed #ddd',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.8,
  },
  emptyTitle: {
    color: '#333',
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  emptyText: {
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '30px',
    maxWidth: '500px',
    margin: '0 auto 30px',
  },
  emptyActions: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '14px 28px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
  },
  secondaryButton: {
    padding: '14px 28px',
    backgroundColor: 'white',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  bookmarksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  bookmarkWrapper: {
    position: 'relative',
  },
  bookmarkMeta: {
    marginBottom: '10px',
    paddingLeft: '5px',
  },
  bookmarkDate: {
    fontSize: '13px',
    color: '#999',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  tipsSection: {
    marginTop: '50px',
    padding: '25px',
    backgroundColor: '#f0f4ff',
    borderRadius: '12px',
    border: '1px solid #d0deff',
  },
  tipsTitle: {
    color: '#667eea',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tipsList: {
    margin: 0,
    paddingLeft: '25px',
    color: '#555',
    lineHeight: '1.8',
  },
};

// Add keyframe animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Bookmarks;