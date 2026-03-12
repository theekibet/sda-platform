import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getForumPosts, createForumPost, getForumPost, createForumReply, markReplyHelpful } from '../../services/api';
import ReportButton from '../../components/Reports/ReportButton'; 
import { CONTENT_TYPES } from "../../utils/constants";  
import Avatar from '../../components/common/Avatar';   

function Forum() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    isAnonymous: false,
  });
  const [newReply, setNewReply] = useState({
    content: '',
    isAnonymous: false,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await getForumPosts();
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await createForumPost({
        ...newPost,
        location: user?.city,
      });
      setNewPost({ title: '', content: '', isAnonymous: false });
      setShowNewPostForm(false);
      fetchPosts();
    } catch (error) {
      alert('Error creating post');
    }
  };

  const handleViewPost = async (postId) => {
    try {
      const response = await getForumPost(postId);
      setSelectedPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!selectedPost) return;
    
    try {
      await createForumReply({
        ...newReply,
        postId: selectedPost.id,
      });
      setNewReply({ content: '', isAnonymous: false });
      handleViewPost(selectedPost.id);
    } catch (error) {
      alert('Error creating reply');
    }
  };

  const handleMarkHelpful = async (replyId) => {
    try {
      await markReplyHelpful(replyId);
      if (selectedPost) {
        handleViewPost(selectedPost.id);
      }
    } catch (error) {
      alert('Error marking as helpful');
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading forum...</div>;
  }

  return (
    <div style={styles.container}>
      {selectedPost ? (
        // Single Post View
        <div>
          <button 
            onClick={() => setSelectedPost(null)}
            style={styles.backButton}
          >
            ← Back to Forum
          </button>
          
          <div style={styles.postDetail}>
            <div style={styles.postHeader}>
              <h2 style={styles.postTitle}>{selectedPost.title}</h2>
              <div style={styles.postHeaderRight}>
                {selectedPost.isAnonymous ? (
                  <span style={styles.anonymousBadge}>Anonymous</span>
                ) : (
                  <div style={styles.authorWithAvatar}>
                    <Avatar user={selectedPost.author} size="small" />
                    <span style={styles.authorName}>{selectedPost.author?.name}</span>
                  </div>
                )}
                <ReportButton
                  contentType={CONTENT_TYPES.FORUM_POST}
                  contentId={selectedPost.id}
                  authorId={selectedPost.author?.id}
                  size="small"
                />
              </div>
            </div>
            <p style={styles.postContent}>{selectedPost.content}</p>
            <div style={styles.postMeta}>
              <span>📍 {selectedPost.location || 'No location'}</span>
              <span>🕐 {new Date(selectedPost.createdAt).toLocaleString()}</span>
            </div>

            {/* Replies Section */}
            <div style={styles.repliesSection}>
              <h3 style={styles.repliesTitle}>Replies ({selectedPost.replies?.length || 0})</h3>
              
              {selectedPost.replies?.map(reply => (
                <div key={reply.id} style={styles.replyCard}>
                  <div style={styles.replyHeader}>
                    <div style={styles.replyHeaderLeft}>
                      {reply.isAnonymous ? (
                        <span style={styles.anonymousBadge}>Anonymous</span>
                      ) : (
                        <div style={styles.authorWithAvatar}>
                          <Avatar user={reply.author} size="small" />
                          <span style={styles.replyAuthor}>{reply.author?.name}</span>
                        </div>
                      )}
                      <span style={styles.replyDate}>
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ReportButton
                      contentType={CONTENT_TYPES.FORUM_REPLY}
                      contentId={reply.id}
                      authorId={reply.author?.id}
                      size="small"
                    />
                  </div>
                  <p style={styles.replyContent}>{reply.content}</p>
                  <button
                    onClick={() => handleMarkHelpful(reply.id)}
                    style={styles.helpfulButton}
                  >
                    👍 Helpful ({reply.helpfulVotes})
                  </button>
                </div>
              ))}

              {/* Add Reply Form */}
              <form onSubmit={handleCreateReply} style={styles.replyForm}>
                <h4 style={styles.replyFormTitle}>Add a Reply</h4>
                <textarea
                  value={newReply.content}
                  onChange={(e) => setNewReply({...newReply, content: e.target.value})}
                  placeholder="Write your reply..."
                  required
                  style={styles.textarea}
                  rows="4"
                />
                <div style={styles.formRow}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newReply.isAnonymous}
                      onChange={(e) => setNewReply({...newReply, isAnonymous: e.target.checked})}
                    />
                    Post anonymously
                  </label>
                  <button type="submit" style={styles.submitButton}>
                    Post Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        // Forum List View
        <div>
          <div style={styles.forumHeader}>
            <h2 style={styles.pageTitle}>Community Forum</h2>
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              style={styles.newPostButton}
            >
              {showNewPostForm ? 'Cancel' : '+ New Discussion'}
            </button>
          </div>

          {/* New Post Form */}
          {showNewPostForm && (
            <form onSubmit={handleCreatePost} style={styles.newPostForm}>
              <h3 style={styles.formTitle}>Start a Discussion</h3>
              <input
                type="text"
                placeholder="Title"
                value={newPost.title}
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                required
                style={styles.input}
              />
              <textarea
                placeholder="What's on your mind?"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                required
                style={styles.textarea}
                rows="5"
              />
              <div style={styles.formRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newPost.isAnonymous}
                    onChange={(e) => setNewPost({...newPost, isAnonymous: e.target.checked})}
                  />
                  Post anonymously
                </label>
                <button type="submit" style={styles.submitButton}>
                  Create Post
                </button>
              </div>
            </form>
          )}

          {/* Posts List */}
          <div style={styles.postsList}>
            {posts.length === 0 ? (
              <p style={styles.emptyText}>No discussions yet. Start one!</p>
            ) : (
              posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => handleViewPost(post.id)}
                  style={styles.postCard}
                >
                  <div style={styles.postHeader}>
                    <h3 style={styles.postTitle}>{post.title}</h3>
                    <div style={styles.postHeaderRight}>
                      {post.isAnonymous ? (
                        <span style={styles.anonymousBadge}>Anonymous</span>
                      ) : (
                        <div style={styles.authorWithAvatar}>
                          <Avatar user={post.author} size="small" />
                          <span style={styles.authorName}>{post.author?.name}</span>
                        </div>
                      )}
                      <ReportButton
                        contentType={CONTENT_TYPES.FORUM_POST}
                        contentId={post.id}
                        authorId={post.author?.id}
                        size="small"
                      />
                    </div>
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
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
  forumHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  pageTitle: {
    margin: 0,
    color: '#333',
  },
  newPostButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  newPostForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  formTitle: {
    margin: '0 0 20px 0',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
    fontFamily: 'inherit',
  },
  formRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#666',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  emptyText: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    color: '#999',
  },
  postCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  postHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
  authorWithAvatar: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
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
  backButton: {
    padding: '10px 20px',
    marginBottom: '20px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  postDetail: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  postContent: {
    fontSize: '16px',
    lineHeight: '1.8',
    color: '#444',
    margin: '20px 0',
  },
  repliesSection: {
    marginTop: '40px',
  },
  repliesTitle: {
    color: '#333',
    marginBottom: '20px',
  },
  replyCard: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  replyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  replyHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  replyAuthor: {
    color: '#667eea',
    fontWeight: '500',
  },
  replyDate: {
    color: '#999',
    fontSize: '12px',
  },
  replyContent: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  helpfulButton: {
    padding: '5px 10px',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  replyForm: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  replyFormTitle: {
    margin: '0 0 15px 0',
    color: '#333',
  },
};

export default Forum;