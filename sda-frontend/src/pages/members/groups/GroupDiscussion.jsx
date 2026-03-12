// src/pages/members/groups/GroupDiscussion.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getDiscussionWithReplies, 
  createDiscussionReply 
} from '../../../services/api';

function GroupDiscussion({ discussion, onBack, onUpdate }) {
  const { user } = useAuth();
  const [discussionData, setDiscussionData] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [newReply, setNewReply] = useState('');

  useEffect(() => {
    fetchDiscussion();
  }, [discussion.id]);

  const fetchDiscussion = async () => {
    setLoading(true);
    try {
      const response = await getDiscussionWithReplies(discussion.id);
      setDiscussionData(response.data);
      setReplies(response.data.replies || []);
    } catch (error) {
      console.error('Error fetching discussion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      await createDiscussionReply({
        content: newReply,
        discussionId: discussion.id,
      });
      setNewReply('');
      setShowReplyForm(false);
      fetchDiscussion(); // Refresh to show new reply
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Error posting reply');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div style={styles.loading}>Loading discussion...</div>;
  }

  if (!discussionData) {
    return <div style={styles.error}>Discussion not found</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Discussions
        </button>
      </div>

      {/* Original Post */}
      <div style={styles.originalPost}>
        <div style={styles.postHeader}>
          <h2 style={styles.postTitle}>{discussionData.title}</h2>
          <div style={styles.postMeta}>
            <span style={styles.author}>By {discussionData.author?.name}</span>
            <span style={styles.date}>{formatDate(discussionData.createdAt)}</span>
          </div>
        </div>
        <div style={styles.postContent}>
          {discussionData.content.split('\n').map((paragraph, idx) => (
            <p key={idx} style={styles.paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* Replies Section */}
      <div style={styles.repliesSection}>
        <div style={styles.repliesHeader}>
          <h3 style={styles.repliesTitle}>
            Replies ({replies.length})
          </h3>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            style={styles.replyButton}
          >
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleSubmitReply} style={styles.replyForm}>
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder="Write your reply..."
              required
              style={styles.textarea}
              rows="4"
            />
            <div style={styles.formButtons}>
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newReply.trim()}
                style={styles.submitButton}
              >
                Post Reply
              </button>
            </div>
          </form>
        )}

        {/* Replies List */}
        {replies.length === 0 ? (
          <div style={styles.emptyReplies}>
            <p style={styles.emptyText}>No replies yet. Be the first to respond!</p>
          </div>
        ) : (
          <div style={styles.repliesList}>
            {replies.map((reply, index) => (
              <div key={reply.id} style={styles.replyCard}>
                <div style={styles.replyHeader}>
                  <span style={styles.replyAuthor}>{reply.author?.name}</span>
                  <span style={styles.replyDate}>{formatDate(reply.createdAt)}</span>
                </div>
                <div style={styles.replyContent}>
                  {reply.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} style={styles.replyParagraph}>{paragraph}</p>
                  ))}
                </div>
                {index < replies.length - 1 && <div style={styles.replyDivider} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  error: {
    textAlign: 'center',
    padding: '40px',
    color: '#c33',
  },
  header: {
    marginBottom: '20px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  originalPost: {
    backgroundColor: '#f9f9f9',
    padding: '25px',
    borderRadius: '10px',
    marginBottom: '30px',
  },
  postHeader: {
    marginBottom: '20px',
  },
  postTitle: {
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '22px',
  },
  postMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '13px',
    color: '#999',
  },
  author: {
    color: '#667eea',
    fontWeight: '500',
  },
  date: {
    color: '#999',
  },
  postContent: {
    color: '#444',
    lineHeight: '1.7',
    fontSize: '16px',
  },
  paragraph: {
    margin: '0 0 15px 0',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  repliesSection: {
    marginTop: '30px',
  },
  repliesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  repliesTitle: {
    margin: 0,
    color: '#333',
    fontSize: '18px',
  },
  replyButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  replyForm: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '25px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
    marginBottom: '15px',
    resize: 'vertical',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    '&:disabled': {
      backgroundColor: '#ccc',
      cursor: 'not-allowed',
    },
  },
  emptyReplies: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  emptyText: {
    color: '#999',
    margin: 0,
  },
  repliesList: {
    display: 'flex',
    flexDirection: 'column',
  },
  replyCard: {
    padding: '20px 0',
  },
  replyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  replyAuthor: {
    fontWeight: '600',
    color: '#667eea',
    fontSize: '14px',
  },
  replyDate: {
    fontSize: '12px',
    color: '#999',
  },
  replyContent: {
    color: '#555',
    lineHeight: '1.6',
    fontSize: '14px',
  },
  replyParagraph: {
    margin: '0 0 10px 0',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  replyDivider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '20px 0 0 0',
  },
};

export default GroupDiscussion;