// src/pages/members/groups/GroupChat.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { groupsService } from '../../../services/groupsService';
import Avatar from '../../../components/common/Avatar';
import MessageReactions from '../../../components/groups/MessageReactions';

function GroupChat({ groupId, groupName, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Initial load
  useEffect(() => {
    if (groupId) {
      fetchMessages();
      
      // Set up polling for new messages (every 3 seconds)
      pollIntervalRef.current = setInterval(() => {
        fetchNewMessages();
      }, 3000);

      // Mark as read when opening chat
      markAsRead();
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (reset = true) => {
    if (!groupId) return;
    
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }
      
      const response = await groupsService.getMessages(groupId, reset ? 1 : page, 50);
      
      // Handle response structure
      const actualData = response.data?.data || response.data;
      const newMessages = actualData.messages || [];
      
      if (reset) {
        setMessages(newMessages.reverse()); // Show latest at bottom
        setHasMore(actualData.totalPages > 1);
      } else {
        setMessages(prev => [...newMessages.reverse(), ...prev]);
      }

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchNewMessages = async () => {
    if (!groupId || messages.length === 0) return;
    
    try {
      const response = await groupsService.getMessages(groupId, 1, 50);
      const actualData = response.data?.data || response.data;
      const latestMessages = actualData.messages || [];
      
      if (latestMessages.length === 0) return;
      
      // Get the latest message ID we have
      const latestExistingId = messages[messages.length - 1]?.id;
      const latestExistingIndex = latestMessages.findIndex(m => m.id === latestExistingId);
      
      if (latestExistingIndex === -1) {
        // We don't have any of these messages - probably first load or different chat
        return;
      }
      
      // Find messages that are newer than our latest
      const newMessages = latestMessages.slice(latestExistingIndex + 1);
      
      if (newMessages.length > 0) {
        setMessages(prev => [...prev, ...newMessages]);
        
        // Mark new messages as read
        const unreadIds = newMessages
          .filter(msg => msg.authorId !== user.id)
          .map(msg => msg.id);
        
        if (unreadIds.length > 0) {
          await groupsService.markAsRead(groupId);
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !groupId) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    try {
      const response = await groupsService.getMessages(groupId, nextPage, 50);
      const actualData = response.data?.data || response.data;
      const olderMessages = actualData.messages || [];
      
      if (olderMessages.length < 50) {
        setHasMore(false);
      }
      
      setMessages(prev => [...olderMessages.reverse(), ...prev]);
      
      // Maintain scroll position
      const container = messagesContainerRef.current;
      if (container && olderMessages.length > 0) {
        const firstNewMessage = container.children[olderMessages.length];
        if (firstNewMessage) {
          firstNewMessage.scrollIntoView();
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
    if ((!newMessage.trim() && !uploadingFile) || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic update
    const tempMessage = {
      id: 'temp-' + Date.now(),
      content: messageText,
      messageType: 'text',
      authorId: user.id,
      author: { 
        id: user.id,
        name: user.name, 
        avatarUrl: user.avatarUrl 
      },
      createdAt: new Date().toISOString(),
      isAnonymous: false,
      sending: true,
      reactions: [],
      _count: { reactions: 0 }
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    try {
      const response = await groupsService.sendMessage(groupId, {
        content: messageText,
        messageType: 'text',
        isAnonymous: false,
        replyToId: replyingTo?.id
      });

      // Handle response
      const actualData = response.data?.data || response.data;

      // Replace temp message with real one
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempMessage.id ? { ...actualData, sending: false } : msg
        )
      );
      
      // Clear reply if any
      setReplyingTo(null);
      
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Upload file first (you'll need an upload endpoint)
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.url;
      
      // Send message with file
      const response = await groupsService.sendMessage(groupId, {
        content: file.name,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: fileUrl,
        fileName: file.name,
        isAnonymous: false
      });
      
      const actualData = response.data?.data || response.data;
      setMessages(prev => [...prev, actualData]);
      scrollToBottom();
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      fileInputRef.current.value = '';
    }
  };

  const handleReaction = async (messageId, reaction) => {
    try {
      await groupsService.addReaction(messageId, reaction);
      
      // Optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions?.find(r => 
            r.userId === user.id && r.reaction === reaction
          );
          
          if (existingReaction) {
            // Remove reaction
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => 
                !(r.userId === user.id && r.reaction === reaction)
              )
            };
          } else {
            // Add reaction
            const newReaction = {
              id: 'temp-' + Date.now(),
              userId: user.id,
              user: { id: user.id, name: user.name },
              reaction
            };
            return {
              ...msg,
              reactions: [...(msg.reactions || []), newReaction]
            };
          }
        }
        return msg;
      }));
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      // Refresh messages to get correct state
      fetchMessages();
    }
  };

  const handleTyping = () => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // This is optional - can be implemented with WebSockets later
    typingTimeoutRef.current = setTimeout(() => {
      // Send stopped typing
    }, 2000);
  };

  const markAsRead = async () => {
    try {
      await groupsService.markAsRead(groupId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
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

  if (!groupId) {
    return (
      <div style={styles.loadingContainer}>
        <p>No group selected</p>
      </div>
    );
  }

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
        
        {/* Reply indicator */}
        {replyingTo && (
          <div style={styles.replyingTo}>
            <span>Replying to {replyingTo.author?.name}</span>
            <button 
              onClick={() => setReplyingTo(null)}
              style={styles.cancelReplyButton}
            >
              ✕
            </button>
          </div>
        )}
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

        {messageGroups.map((group) => (
          <div key={`date-${group.date}`}>
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
                <div key={message.id}>
                  <div
                    style={{
                      ...styles.messageRow,
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isMe && showAvatar && (
                      <Avatar 
                        user={message.author} 
                        size="small" 
                        style={styles.avatar}
                      />
                    )}
                    
                    <div
                      style={{
                        ...styles.messageWrapper,
                        marginLeft: !isMe && !showAvatar ? '48px' : '8px',
                        maxWidth: message.messageType === 'image' ? '300px' : '70%',
                      }}
                    >
                      {!isMe && showAvatar && (
                        <span style={styles.messageAuthor}>
                          {message.author?.name}
                        </span>
                      )}
                      
                      {/* Message content based on type */}
                      <div
                        style={{
                          ...styles.messageBubble,
                          backgroundColor: isMe ? '#667eea' : '#f0f0f0',
                          color: isMe ? 'white' : '#333',
                          padding: message.messageType === 'image' ? '4px' : '10px 14px',
                        }}
                      >
                        {message.messageType === 'image' ? (
                          <img 
                            src={message.fileUrl} 
                            alt={message.content}
                            style={styles.messageImage}
                            onClick={() => window.open(message.fileUrl, '_blank')}
                          />
                        ) : message.messageType === 'file' ? (
                          <a 
                            href={message.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={styles.fileLink}
                          >
                            📎 {message.fileName || message.content}
                          </a>
                        ) : (
                          <p style={styles.messageContent}>{message.content}</p>
                        )}
                        
                        {/* Edited indicator */}
                        {message.isEdited && (
                          <span style={styles.editedIndicator}>(edited)</span>
                        )}
                        
                        <div style={styles.messageFooter}>
                          <span style={styles.messageTime}>
                            {formatTime(message.createdAt)}
                          </span>
                          {isMe && (
                            <span style={styles.messageStatus}>
                              {message.sending ? '⏳' : '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Reactions */}
                      <MessageReactions
                        messageId={message.id}
                        reactions={message.reactions || []}
                        onReact={(reaction) => handleReaction(message.id, reaction)}
                      />
                    </div>
                  </div>

                  {/* Reply button */}
                  <div style={{
                    ...styles.replyButtonContainer,
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginLeft: !isMe ? '48px' : '0',
                    marginRight: isMe ? '48px' : '0',
                  }}>
                    <button
                      onClick={() => setReplyingTo(message)}
                      style={styles.replyButton}
                    >
                      Reply
                    </button>
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
        {/* File upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={styles.fileButton}
          disabled={uploadingFile}
        >
          {uploadingFile ? '⏳' : '📎'}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Emoji button (optional) */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={styles.emojiButton}
        >
          😊
        </button>

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
          placeholder={replyingTo ? `Reply to ${replyingTo.author?.name}...` : "Type a message..."}
          style={styles.input}
          rows="1"
        />
        <button
          type="submit"
          disabled={(!newMessage.trim() && !uploadingFile) || sending}
          style={{
            ...styles.sendButton,
            opacity: (!newMessage.trim() && !uploadingFile) || sending ? 0.5 : 1,
            cursor: (!newMessage.trim() && !uploadingFile) || sending ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </form>

      {/* Emoji picker placeholder - you can add a real emoji picker library here */}
      {showEmojiPicker && (
        <div style={styles.emojiPicker}>
          <button onClick={() => {
            setNewMessage(prev => prev + '😊');
            setShowEmojiPicker(false);
          }}>😊</button>
          <button onClick={() => {
            setNewMessage(prev => prev + '🙏');
            setShowEmojiPicker(false);
          }}>🙏</button>
          <button onClick={() => {
            setNewMessage(prev => prev + '❤️');
            setShowEmojiPicker(false);
          }}>❤️</button>
          <button onClick={() => {
            setNewMessage(prev => prev + '👍');
            setShowEmojiPicker(false);
          }}>👍</button>
          <button onClick={() => {
            setNewMessage(prev => prev + '🎉');
            setShowEmojiPicker(false);
          }}>🎉</button>
        </div>
      )}
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
    position: 'relative',
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
    position: 'relative',
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
  replyingTo: {
    position: 'absolute',
    bottom: '-30px',
    left: '16px',
    right: '16px',
    backgroundColor: '#f0f4ff',
    padding: '8px 16px',
    borderRadius: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: '#667eea',
    zIndex: 10,
  },
  cancelReplyButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '14px',
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
    marginBottom: '2px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    marginRight: '8px',
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
    borderRadius: '18px',
    borderBottomLeftRadius: '4px',
    wordWrap: 'break-word',
    position: 'relative',
  },
  messageContent: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap',
  },
  messageImage: {
    maxWidth: '100%',
    maxHeight: '200px',
    borderRadius: '12px',
    cursor: 'pointer',
  },
  fileLink: {
    color: 'inherit',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  editedIndicator: {
    fontSize: '10px',
    opacity: 0.7,
    marginLeft: '4px',
    fontStyle: 'italic',
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    marginTop: '2px',
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.7,
  },
  messageStatus: {
    fontSize: '10px',
    opacity: 0.7,
  },
  replyButtonContainer: {
    display: 'flex',
    marginTop: '2px',
    marginBottom: '8px',
  },
  replyButton: {
    background: 'none',
    border: 'none',
    fontSize: '11px',
    color: '#999',
    cursor: 'pointer',
    padding: '2px 8px',
    '&:hover': {
      color: '#667eea',
    },
  },
  inputArea: {
    display: 'flex',
    padding: '12px',
    backgroundColor: 'white',
    borderTop: '1px solid #eaeaea',
    gap: '8px',
    alignItems: 'flex-end',
  },
  fileButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    color: '#667eea',
    '&:hover': {
      backgroundColor: '#f0f0f0',
      borderRadius: '20px',
    },
  },
  emojiButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    color: '#667eea',
    '&:hover': {
      backgroundColor: '#f0f0f0',
      borderRadius: '20px',
    },
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
  emojiPicker: {
    position: 'absolute',
    bottom: '80px',
    right: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '5px',
    zIndex: 100,
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