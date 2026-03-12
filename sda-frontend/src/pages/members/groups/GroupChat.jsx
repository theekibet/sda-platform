// src/pages/members/groups/GroupChat.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getDiscussionWithReplies, 
  createDiscussionReply,
  markMessagesAsRead 
} from '../../../services/api';
import Avatar from '../../../components/common/Avatar';// ✅ ADD THIS

function GroupChat({ discussionId, groupName, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Initial load
  useEffect(() => {
    fetchMessages();
    
    // Set up polling for new messages (every 2 seconds for better real-time feel)
    pollIntervalRef.current = setInterval(() => {
      fetchNewMessages();
    }, 2000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [discussionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }
      
      const response = await getDiscussionWithReplies(discussionId, reset ? 1 : page);
      const newMessages = response.data.replies || [];
      
      if (reset) {
        setMessages(newMessages);
        setHasMore(newMessages.length === 20);
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      }

      // Mark messages as read
      if (newMessages.length > 0) {
        const unreadIds = newMessages
          .filter(msg => msg.authorId !== user.id && !msg.read)
          .map(msg => msg.id);
        
        if (unreadIds.length > 0) {
          await markMessagesAsRead(discussionId, unreadIds);
        }
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // IMPROVED: Better polling logic that actually detects new messages
  const fetchNewMessages = async () => {
    try {
      // Fetch the latest messages (page 1)
      const response = await getDiscussionWithReplies(discussionId, 1, 50);
      const latestMessages = response.data.replies || [];
      
      if (latestMessages.length === 0) return;
      
      // If we have no messages yet, just set them
      if (messages.length === 0) {
        setMessages(latestMessages);
        return;
      }
      
      // Get the IDs of messages we already have
      const existingIds = new Set(messages.map(m => m.id));
      
      // Find messages that are new (not in our current messages)
      const newMessages = latestMessages.filter(msg => !existingIds.has(msg.id));
      
      if (newMessages.length > 0) {
        console.log(`Found ${newMessages.length} new messages:`, newMessages);
        
        // Add new messages to the end
        setMessages(prev => [...prev, ...newMessages]);
        
        // Mark new messages as read
        const unreadIds = newMessages
          .filter(msg => msg.authorId !== user.id)
          .map(msg => msg.id);
        
        if (unreadIds.length > 0) {
          await markMessagesAsRead(discussionId, unreadIds);
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    try {
      const response = await getDiscussionWithReplies(discussionId, nextPage);
      const olderMessages = response.data.replies || [];
      
      if (olderMessages.length < 20) {
        setHasMore(false);
      }
      
      setMessages(prev => [...olderMessages.reverse(), ...prev]);
      
      // Maintain scroll position
      const container = messagesContainerRef.current;
      if (container) {
        const firstMessage = container.children[olderMessages.length];
        if (firstMessage) {
          firstMessage.scrollIntoView();
        }
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: 'temp-' + Date.now(),
      content: messageText,
      authorId: user.id,
      author: { name: user.name, avatarUrl: user.avatarUrl },
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const response = await createDiscussionReply({
        content: messageText,
        discussionId,
      });

      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? { ...response.data, sending: false } : msg
        )
      );
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // This is optional - can be implemented later
    typingTimeoutRef.current = setTimeout(() => {
      // Send stopped typing
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container && container.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading conversation...</p>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate();

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ←
        </button>
        <div style={styles.headerInfo}>
          <h3 style={styles.groupName}>{groupName}</h3>
          {typingUsers.length > 0 && (
            <span style={styles.typingIndicator}>
              {typingUsers.join(', ')} typing...
            </span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        style={styles.messagesContainer}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div style={styles.loadingMore}>
            <div style={styles.loadingMoreSpinner}></div>
          </div>
        )}

        {messageGroups.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div style={styles.dateSeparator}>
              <span style={styles.dateText}>
                {new Date(group.date).toLocaleDateString([], { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>

            {/* Messages */}
            {group.messages.map((message, index) => {
              const isMe = message.authorId === user.id;
              const showAvatar = index === 0 || 
                group.messages[index - 1]?.authorId !== message.authorId;

              return (
                <div
                  key={message.id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isMe && showAvatar && (
                    <Avatar user={message.author} size="small" />
                  )}
                  
                  <div
                    style={{
                      ...styles.messageWrapper,
                      marginLeft: !isMe && !showAvatar ? '48px' : '8px',
                    }}
                  >
                    {!isMe && showAvatar && (
                      <span style={styles.messageAuthor}>
                        {message.author?.name}
                      </span>
                    )}
                    
                    <div
                      style={{
                        ...styles.messageBubble,
                        backgroundColor: isMe ? '#667eea' : '#f0f0f0',
                        color: isMe ? 'white' : '#333',
                      }}
                    >
                      <p style={styles.messageContent}>{message.content}</p>
                      
                      <div style={styles.messageFooter}>
                        <span style={styles.messageTime}>
                          {formatTime(message.createdAt)}
                        </span>
                        {isMe && (
                          <span style={styles.messageStatus}>
                            {message.sending ? '⏳' : message.read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={styles.inputArea}>
        <textarea
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder="Type a message..."
          style={styles.input}
          rows="1"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          style={{
            ...styles.sendButton,
            opacity: !newMessage.trim() || sending ? 0.5 : 1,
            cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '70vh',
    backgroundColor: '#f5f7fb',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #eaeaea',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    color: '#666',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderBottom: '1px solid #eaeaea',
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    marginRight: '12px',
    color: '#667eea',
    padding: '0 8px',
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  typingIndicator: {
    fontSize: '12px',
    color: '#667eea',
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  loadingMore: {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px',
  },
  loadingMoreSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  dateSeparator: {
    display: 'flex',
    justifyContent: 'center',
    margin: '20px 0',
  },
  dateText: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: '4px 12px',
    borderRadius: '15px',
    fontSize: '12px',
    color: '#666',
  },
  messageRow: {
    display: 'flex',
    marginBottom: '4px',
  },
  messageWrapper: {
    maxWidth: '70%',
  },
  messageAuthor: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '2px',
    color: '#667eea',
    marginLeft: '4px',
  },
  messageBubble: {
    padding: '10px 14px',
    borderRadius: '18px',
    borderBottomLeftRadius: '4px',
    wordWrap: 'break-word',
  },
  messageContent: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.7,
  },
  messageStatus: {
    fontSize: '10px',
    opacity: 0.7,
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    backgroundColor: 'white',
    borderTop: '1px solid #eaeaea',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    resize: 'none',
    fontFamily: 'inherit',
    fontSize: '14px',
    maxHeight: '100px',
    outline: 'none',
    '&:focus': {
      borderColor: '#667eea',
    },
  },
  sendButton: {
    padding: '8px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    alignSelf: 'flex-end',
    transition: 'opacity 0.2s',
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

export default GroupChat;