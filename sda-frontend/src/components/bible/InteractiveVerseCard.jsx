// src/components/bible/InteractiveVerseCard.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useVerseInteractions } from '../../hooks/useVerseInteractions';
import VerseCard from './VerseCard';

/**
 * Interactive Verse Card with social features (likes, comments, bookmarks)
 * Reusable component that can be used anywhere you want to display a verse
 * with full interaction capabilities
 */
const InteractiveVerseCard = ({ 
  verse, 
  className = '',
  showReadButton = true,
  showSharedBy = true,
}) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Get verse ID safely from different possible data structures
  const getVerseId = () => {
    return verse?.verse?.id || verse?.id;
  };

  const verseId = getVerseId();

  // Use the custom hook for all interaction logic
  const {
    liked,
    bookmarked,
    likeCount,
    comments,
    loading,
    error,
    handleLike,
    handleBookmark,
    handleAddComment,
  } = useVerseInteractions(verseId);

  // Handle comment submission
  const onSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    const success = await handleAddComment(newComment);
    
    if (success) {
      setNewComment('');
    }
    setSubmittingComment(false);
  };

  // Get verse data for the "Read in context" button
  const getVerseData = () => {
    const verseData = verse?.verse || verse;
    return {
      book: verseData?.book,
      chapter: verseData?.chapter,
    };
  };

  if (!verse) return null;

  return (
    <div style={styles.container} className={className}>
      {/* Verse Display */}
      <VerseCard verse={verse} showSharedBy={showSharedBy} />

      {/* Interaction Bar */}
      <div style={styles.interactionBar}>
        <button 
          onClick={handleLike} 
          style={{
            ...styles.interactionButton, 
            color: liked ? '#e74c3c' : '#666'
          }}
          title={liked ? "Unlike this verse" : "Like this verse"}
          disabled={loading}
        >
          {liked ? '❤️' : '🤍'} 
          {likeCount > 0 && <span style={styles.count}>{likeCount}</span>}
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)} 
          style={{
            ...styles.interactionButton,
            color: showComments ? '#667eea' : '#666'
          }}
          title="View comments"
        >
          💬 {comments.length > 0 && <span style={styles.count}>{comments.length}</span>}
        </button>
        
        <button 
          onClick={handleBookmark} 
          style={{
            ...styles.interactionButton, 
            color: bookmarked ? '#f39c12' : '#666'
          }}
          title={bookmarked ? "Remove bookmark" : "Bookmark this verse"}
          disabled={loading}
        >
          {bookmarked ? '🔖' : '📑'}
        </button>
        
        {showReadButton && getVerseData().book && getVerseData().chapter && (
          <button 
            onClick={() => {
              const { book, chapter } = getVerseData();
              window.open(`/bible/read/${book}/${chapter}`, '_blank');
            }}
            style={styles.interactionButton}
            title="Read in context"
          >
            📖 Read
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div style={styles.commentsSection}>
          <h3 style={styles.commentsTitle}>
            💬 Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
          
          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={onSubmitComment} style={styles.commentForm}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this verse..."
                style={styles.commentInput}
                rows="3"
                disabled={submittingComment}
              />
              <button 
                type="submit" 
                disabled={submittingComment || !newComment.trim()}
                style={{
                  ...styles.commentSubmit,
                  opacity: submittingComment || !newComment.trim() ? 0.6 : 1,
                  cursor: submittingComment || !newComment.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div style={styles.loginPrompt}>
              <p>
                <a href="/login" style={styles.loginLink}>Login</a> to join the discussion
              </p>
            </div>
          )}

          {/* Comments List */}
          <div style={styles.commentsList}>
            {comments.length === 0 ? (
              <p style={styles.noComments}>
                {user 
                  ? "No comments yet. Be the first to share your thoughts!" 
                  : "No comments yet."}
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} style={styles.commentItem}>
                  <div style={styles.commentHeader}>
                    <div style={styles.commentAuthor}>
                      <span style={styles.authorAvatar}>
                        {(comment.user?.name || 'A')[0].toUpperCase()}
                      </span>
                      <strong>{comment.user?.name || 'Anonymous'}</strong>
                    </div>
                    <span style={styles.commentTime}>
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(comment.createdAt).getFullYear() !== new Date().getFullYear() 
                          ? 'numeric' 
                          : undefined
                      })}
                    </span>
                  </div>
                  <p style={styles.commentContent}>{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  interactionBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '15px 20px',
    borderTop: '1px solid #eaeaea',
    gap: '8px',
    flexWrap: 'wrap',
  },
  interactionButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#666',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '20px',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  count: {
    fontSize: '14px',
    fontWeight: '600',
    marginLeft: '2px',
  },
  errorMessage: {
    padding: '12px 20px',
    backgroundColor: '#fee',
    color: '#c33',
    fontSize: '14px',
    borderTop: '1px solid #fdd',
  },
  commentsSection: {
    padding: '20px',
    borderTop: '1px solid #eaeaea',
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
  },
  commentsTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '15px',
    fontWeight: '600',
  },
  commentForm: {
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  commentInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    marginBottom: '10px',
    resize: 'vertical',
    lineHeight: '1.5',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  commentSubmit: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    float: 'right',
    transition: 'background-color 0.2s',
  },
  loginPrompt: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  loginLink: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
  commentsList: {
    clear: 'both',
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    padding: '30px 20px',
    fontSize: '14px',
    fontStyle: 'italic',
  },
  commentItem: {
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  commentAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  authorAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  commentTime: {
    fontSize: '12px',
    color: '#999',
  },
  commentContent: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export default InteractiveVerseCard;