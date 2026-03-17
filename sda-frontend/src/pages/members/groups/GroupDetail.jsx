// src/pages/members/groups/GroupDetail.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsService } from '../../../services/groupsService';
import { getCategoryIcon, getCategoryLabel } from '../../../utils/groupCategories';
import GroupChat from './GroupChat';
import GroupEvents from '../../../components/groups/GroupEvents'; // NEW IMPORT
import MessageReactions from '../../../components/groups/MessageReactions';
import './Group.css';

function GroupDetail({ groupId: propGroupId, onBack }) {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  
  // Check both params.id and params.groupId
  const groupId = propGroupId || params?.id || params?.groupId;
  
  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinned, setLoadingPinned] = useState(false);

  useEffect(() => {
    console.log('🔍 GroupDetail useEffect triggered');
    console.log('📍 Final groupId:', groupId);
    
    if (groupId) {
      console.log('✅ GroupId exists, fetching data...');
      fetchGroupData();
      fetchPinnedMessages();
    } else {
      console.log('❌ No groupId found');
      setLoading(false);
    }

    // Set up polling for unread count
    const interval = setInterval(() => {
      if (groupId && group?.userMembership?.status === 'approved') {
        fetchUnreadCount();
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [groupId]);

  const fetchGroupData = async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching group with ID:', groupId);
      const response = await groupsService.getGroupById(groupId);
      console.log('✅ Group response:', response);
      
      // Handle response structure
      const actualGroupData = response.data?.data || response.data;
      console.log('🎯 Actual group data:', actualGroupData);
      setGroup(actualGroupData);
      
      // Set initial unread count
      if (actualGroupData.unreadCount !== undefined) {
        setUnreadCount(actualGroupData.unreadCount);
      }
      
    } catch (error) {
      console.error('❌ Error fetching group:', error);
      
      if (error.response?.status === 404) {
        setError('Group not found');
      } else if (error.response?.status === 403) {
        setError('You do not have access to this group');
      } else {
        setError('Failed to load group');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPinnedMessages = async () => {
    if (!groupId) return;
    
    setLoadingPinned(true);
    try {
      const response = await groupsService.getPinnedMessages(groupId);
      const messages = response.data?.data || response.data || [];
      setPinnedMessages(messages);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    } finally {
      setLoadingPinned(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!groupId) return;
    
    try {
      const response = await groupsService.getGroupById(groupId);
      const actualGroupData = response.data?.data || response.data;
      
      if (actualGroupData.unreadCount !== undefined) {
        setUnreadCount(actualGroupData.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await groupsService.leaveGroup(groupId);
        if (onBack) {
          onBack();
        } else {
          navigate('/groups');
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Error leaving group');
      }
    }
  };

  const handleApproveMember = async (memberId) => {
    if (!groupId) return;
    
    try {
      await groupsService.approveMember(groupId, memberId);
      fetchGroupData();
    } catch (error) {
      alert('Error approving member');
    }
  };

  const handleRejectMember = async (memberId) => {
    if (!groupId) return;
    
    try {
      await groupsService.rejectMember(groupId, memberId);
      fetchGroupData();
    } catch (error) {
      alert('Error rejecting member');
    }
  };

  const handleJoinRequest = async () => {
    if (!groupId) return;
    
    try {
      await groupsService.joinGroup(groupId, joinMessage);
      setShowJoinForm(false);
      fetchGroupData();
    } catch (error) {
      alert('Error sending request');
    }
  };

  const handleBackToGroups = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/groups');
    }
  };

  const handleChatTabClick = () => {
    setActiveTab('chat');
    // Mark as read when opening chat
    if (groupId && group?.userMembership?.status === 'approved') {
      groupsService.markAsRead(groupId).catch(console.error);
      setUnreadCount(0);
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

  // No group ID state
  if (!groupId) {
    return (
      <div className="groups-container">
        <div className="groups-empty-state">
          <p className="groups-empty-text">No group selected</p>
          <button 
            onClick={handleBackToGroups}
            className="groups-create-button"
          >
            ← Back to Groups
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="groups-loading">
        Loading group...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="groups-container">
        <div className="groups-empty-state">
          <p className="groups-empty-text">{error}</p>
          <button 
            onClick={handleBackToGroups}
            className="groups-create-button"
          >
            ← Back to Groups
          </button>
        </div>
      </div>
    );
  }

  // No group data
  if (!group) {
    return (
      <div className="groups-loading">
        No group data...
      </div>
    );
  }

  // Check membership status
  const isMember = group.userMembership?.status === 'approved';
  const isPending = group.userMembership?.status === 'pending';
  const isAdmin = group.userMembership?.role === 'admin';

  return (
    <div className="group-detail-container">
      {/* Header */}
      <div className="group-detail-header">
        <button onClick={handleBackToGroups} className="group-detail-back-button">
          ← Back to Groups
        </button>
        {isMember && (
          <button onClick={handleLeaveGroup} className="group-detail-leave-button">
            Leave Group
          </button>
        )}
      </div>

      {/* Group Info Card */}
      <div className="group-detail-card">
        <div className="group-detail-header-info">
          <div>
            <span className="group-detail-category">
              {getCategoryIcon(group.category)} {getCategoryLabel(group.category)}
            </span>
            {group.isPrivate && (
              <span className="group-detail-private-badge">🔒 Private Group</span>
            )}
          </div>
          <h1 className="group-detail-name">{group.name}</h1>
          <p className="group-detail-meta">
            <span>👥 {group.memberCount || 0} members</span>
            {group.location && <span>📍 {group.location}</span>}
            {group.meetingType && (
              <span>
                {group.meetingType === 'online' && '💻 Online'}
                {group.meetingType === 'in-person' && '🤝 In-Person'}
                {group.meetingType === 'hybrid' && '🔄 Hybrid'}
              </span>
            )}
            <span>📅 Created {new Date(group.createdAt).toLocaleDateString()}</span>
            <span>💬 {group.messageCount || 0} messages</span>
          </p>
        </div>

        {!isMember && !isPending && (
          <div className="group-detail-join-section">
            <p className="group-detail-join-text">Want to join this group?</p>
            <button
              onClick={() => setShowJoinForm(true)}
              className="group-detail-join-button"
            >
              Request to Join
            </button>
          </div>
        )}

        {isPending && (
          <div className="group-detail-pending-section">
            <span className="group-detail-pending-badge">⏳ Membership Pending Approval</span>
          </div>
        )}
      </div>

      {/* Join Request Form */}
      {showJoinForm && (
        <div className="group-detail-join-form">
          <h3 className="group-detail-form-title">Request to Join</h3>
          <textarea
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            placeholder="Optional message to the group admins..."
            className="group-detail-textarea"
            rows="3"
          />
          <div className="group-detail-form-buttons">
            <button
              onClick={() => setShowJoinForm(false)}
              className="group-detail-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleJoinRequest}
              className="group-detail-submit-button"
            >
              Send Request
            </button>
          </div>
        </div>
      )}

      {/* Tabs with unread badge */}
      <div className="group-detail-tabs">
        <button
          onClick={() => setActiveTab('about')}
          className={`group-detail-tab ${activeTab === 'about' ? 'group-detail-tab-active' : ''}`}
        >
          📋 About
        </button>
        <button
          onClick={handleChatTabClick}
          className={`group-detail-tab ${activeTab === 'chat' ? 'group-detail-tab-active' : ''}`}
          style={{ position: 'relative' }}
        >
          💬 Chat
          {unreadCount > 0 && activeTab !== 'chat' && (
            <span style={styles.unreadBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        {/* NEW EVENTS TAB - Visible to all members */}
        {isMember && (
          <button
            onClick={() => setActiveTab('events')}
            className={`group-detail-tab ${activeTab === 'events' ? 'group-detail-tab-active' : ''}`}
          >
            📅 Events
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('members')}
            className={`group-detail-tab ${activeTab === 'members' ? 'group-detail-tab-active' : ''}`}
          >
            👥 Members ({group.members?.length || 0})
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="group-detail-content">
        {activeTab === 'about' && (
          <div>
            <h3 className="groups-special-title">About this Group</h3>
            <p className="group-card-description">{group.description}</p>
            
            {/* Pinned Messages Section */}
            {isMember && pinnedMessages.length > 0 && (
              <>
                <h3 className="groups-special-title">📌 Pinned Messages</h3>
                <div style={styles.pinnedMessages}>
                  {pinnedMessages.map(message => (
                    <div key={message.id} style={styles.pinnedMessage}>
                      <div style={styles.pinnedMessageHeader}>
                        <span style={styles.pinnedMessageAuthor}>
                          {message.author?.name}
                        </span>
                        <span style={styles.pinnedMessageDate}>
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p style={styles.pinnedMessageContent}>
                        {message.content}
                      </p>
                      {message.reactions && message.reactions.length > 0 && (
                        <div style={styles.pinnedMessageReactions}>
                          {Object.entries(
                            message.reactions.reduce((acc, r) => {
                              acc[r.reaction] = (acc[r.reaction] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([reaction, count]) => (
                            <span key={reaction} style={styles.pinnedReaction}>
                              {reaction === 'like' && '👍'}
                              {reaction === 'love' && '❤️'}
                              {reaction === 'pray' && '🙏'}
                              {reaction === 'amen' && '🙌'}
                              {reaction === 'thanks' && '🎉'} {count}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {group.rules && (
              <>
                <h3 className="groups-special-title">Group Rules</h3>
                <p className="group-card-description">{group.rules}</p>
              </>
            )}
            
            <h3 className="groups-special-title">Created By</h3>
            <div style={styles.creatorInfo}>
              {group.createdBy?.avatarUrl ? (
                <img 
                  src={group.createdBy.avatarUrl} 
                  alt={group.createdBy.name}
                  style={styles.creatorAvatar}
                />
              ) : (
                <div style={styles.creatorAvatarPlaceholder}>
                  {group.createdBy?.name?.charAt(0) || '?'}
                </div>
              )}
              <span style={styles.creatorName}>{group.createdBy?.name}</span>
            </div>

            {/* Meeting Info */}
            {group.meetingType && (
              <>
                <h3 className="groups-special-title">Meeting Info</h3>
                <div style={styles.meetingInfo}>
                  <p>
                    <strong>Type:</strong>{' '}
                    {group.meetingType === 'online' && '💻 Online'}
                    {group.meetingType === 'in-person' && '🤝 In-Person'}
                    {group.meetingType === 'hybrid' && '🔄 Hybrid'}
                  </p>
                  {group.isLocationBased && (
                    <p>
                      <strong>Location Specific:</strong> Yes - This group serves a specific area
                    </p>
                  )}
                  {group.location && (
                    <p>
                      <strong>Location:</strong> {group.location}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && isMember ? (
          <GroupChat
            groupId={groupId}
            groupName={group.name}
            onBack={() => setActiveTab('about')}
          />
        ) : activeTab === 'chat' && !isMember ? (
          <div className="groups-empty-state">
            <p className="groups-empty-text">
              {isPending 
                ? 'Your membership is pending approval. You can join the chat once approved.'
                : 'Join this group to participate in the chat.'}
            </p>
          </div>
        ) : null}

        {/* NEW EVENTS TAB CONTENT */}
        {activeTab === 'events' && isMember && (
          <GroupEvents 
            groupId={groupId} 
            isAdmin={isAdmin}
          />
        )}

        {/* Members Tab */}
        {activeTab === 'members' && isAdmin && (
          <div>
            <h3 className="groups-special-title">Members</h3>
            <div style={styles.membersList}>
              {/* Pending members first */}
              {group.members?.filter(m => m.status === 'pending').length > 0 && (
                <>
                  <h4 style={styles.membersSubtitle}>⏳ Pending Approval</h4>
                  {group.members
                    .filter(m => m.status === 'pending')
                    .map(member => (
                      <div key={member.id} className="group-card" style={styles.memberCard}>
                        <div style={styles.memberInfo}>
                          <div style={styles.memberAvatar}>
                            {member.member.avatarUrl ? (
                              <img src={member.member.avatarUrl} alt={member.member.name} style={styles.memberAvatarImg} />
                            ) : (
                              <div style={styles.memberAvatarPlaceholder}>
                                {member.member.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div style={styles.memberDetails}>
                            <span style={styles.memberName}>{member.member.name}</span>
                            <span style={styles.memberRole}>
                              {member.role === 'admin' ? '👑 Admin' : 
                               member.role === 'moderator' ? '🛡️ Moderator' : 'Member'}
                            </span>
                          </div>
                        </div>
                        
                        <div style={styles.memberActions}>
                          <button
                            onClick={() => handleApproveMember(member.memberId)}
                            className="group-card-join-button"
                            style={styles.approveButton}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectMember(member.memberId)}
                            className="group-detail-leave-button"
                            style={styles.rejectButton}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {/* Approved members */}
              <h4 style={styles.membersSubtitle}>✅ Members</h4>
              {group.members
                ?.filter(m => m.status === 'approved')
                .map(member => (
                  <div key={member.id} className="group-card" style={styles.memberCard}>
                    <div style={styles.memberInfo}>
                      <div style={styles.memberAvatar}>
                        {member.member.avatarUrl ? (
                          <img src={member.member.avatarUrl} alt={member.member.name} style={styles.memberAvatarImg} />
                        ) : (
                          <div style={styles.memberAvatarPlaceholder}>
                            {member.member.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div style={styles.memberDetails}>
                        <span style={styles.memberName}>{member.member.name}</span>
                        <span style={styles.memberRole}>
                          {member.role === 'admin' ? '👑 Admin' : 
                           member.role === 'moderator' ? '🛡️ Moderator' : 'Member'}
                        </span>
                      </div>
                    </div>
                    <div style={styles.memberJoined}>
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Additional styles not covered by CSS
const styles = {
  unreadBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff4444',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '10px',
    minWidth: '16px',
    textAlign: 'center',
  },
  pinnedMessages: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px',
  },
  pinnedMessage: {
    backgroundColor: '#fff9c4',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ffe082',
  },
  pinnedMessageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  pinnedMessageAuthor: {
    fontWeight: '600',
    color: '#333',
    fontSize: '13px',
  },
  pinnedMessageDate: {
    fontSize: '11px',
    color: '#999',
  },
  pinnedMessageContent: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#333',
  },
  pinnedMessageReactions: {
    display: 'flex',
    gap: '8px',
  },
  pinnedReaction: {
    fontSize: '12px',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: '2px 6px',
    borderRadius: '12px',
  },
  creatorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '10px',
  },
  creatorAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    objectFit: 'cover',
  },
  creatorAvatarPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
  },
  creatorName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333',
  },
  meetingInfo: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '10px',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  membersSubtitle: {
    margin: '10px 0 5px 0',
    color: '#666',
    fontSize: '14px',
  },
  memberCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  memberAvatar: {
    width: '36px',
    height: '36px',
  },
  memberAvatarImg: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    objectFit: 'cover',
  },
  memberAvatarPlaceholder: {
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
  },
  memberDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  memberName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: '12px',
    color: '#666',
  },
  memberActions: {
    display: 'flex',
    gap: '8px',
  },
  approveButton: {
    padding: '6px 12px',
    fontSize: '12px',
  },
  rejectButton: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#dc3545',
  },
  memberJoined: {
    fontSize: '11px',
    color: '#999',
  },
};

export default GroupDetail;