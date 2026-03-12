// src/pages/members/groups/GroupDetail.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getGroupById, 
  leaveGroup, 
  approveMember, 
  rejectMember,
  getGroupDiscussions,
  createDiscussion,
  joinGroup
} from '../../../services/api';
import { getCategoryIcon, getCategoryLabel } from '../../../utils/groupCategories';
import GroupChat from './GroupChat';

function GroupDetail({ groupId, onBack }) {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const groupRes = await getGroupById(groupId);
      setGroup(groupRes.data);
      
      const discussionsRes = await getGroupDiscussions(groupId);
      setDiscussions(discussionsRes.data.discussions || []);
    } catch (error) {
      console.error('Error fetching group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        await leaveGroup(groupId);
        onBack(); // Go back to groups list
      } catch (error) {
        alert(error.response?.data?.message || 'Error leaving group');
      }
    }
  };

  const handleApproveMember = async (memberId) => {
    try {
      await approveMember(groupId, memberId);
      fetchGroupData();
    } catch (error) {
      alert('Error approving member');
    }
  };

  const handleRejectMember = async (memberId) => {
    try {
      await rejectMember(groupId, memberId);
      fetchGroupData();
    } catch (error) {
      alert('Error rejecting member');
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await createDiscussion({
        ...newDiscussion,
        groupId,
      });
      setNewDiscussion({ title: '', content: '' });
      setShowDiscussionForm(false);
      const discussionsRes = await getGroupDiscussions(groupId);
      setDiscussions(discussionsRes.data.discussions || []);
    } catch (error) {
      alert('Error creating discussion');
    }
  };

  const handleBackFromChat = () => {
    setSelectedDiscussion(null);
    fetchGroupData(); // Refresh discussions list
  };

  const isAdmin = group?.userMembership?.role === 'admin' || group?.userMembership?.role === 'moderator';
  const isMember = group?.userMembership?.status === 'approved';
  const isPending = group?.userMembership?.status === 'pending';

  if (loading) {
    return <div style={styles.loading}>Loading group...</div>;
  }

  if (!group) {
    return <div style={styles.error}>Group not found</div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Groups
        </button>
        
        {isMember && (
          <button onClick={handleLeaveGroup} style={styles.leaveButton}>
            Leave Group
          </button>
        )}
      </div>

      {/* Group Info Card */}
      <div style={styles.groupCard}>
        <div style={styles.groupHeader}>
          <div>
            <span style={styles.category}>
              {getCategoryIcon(group.category)} {getCategoryLabel(group.category)}
            </span>
            {group.isPrivate && (
              <span style={styles.privateBadge}>🔒 Private Group</span>
            )}
          </div>
          <h1 style={styles.groupName}>{group.name}</h1>
          <p style={styles.groupMeta}>
            <span>👥 {group.memberCount} members</span>
            {group.location && <span>📍 {group.location}</span>}
            <span>📅 Created {new Date(group.createdAt).toLocaleDateString()}</span>
          </p>
        </div>

        {!isMember && !isPending && (
          <div style={styles.joinSection}>
            <p style={styles.joinText}>Want to join this group?</p>
            <button
              onClick={() => setShowJoinForm(true)}
              style={styles.joinButton}
            >
              Request to Join
            </button>
          </div>
        )}

        {isPending && (
          <div style={styles.pendingSection}>
            <span style={styles.pendingBadge}>⏳ Membership Pending Approval</span>
          </div>
        )}
      </div>

      {/* Join Request Form */}
      {showJoinForm && (
        <div style={styles.joinForm}>
          <h3 style={styles.formTitle}>Request to Join</h3>
          <textarea
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            placeholder="Optional message to the group admins..."
            style={styles.textarea}
            rows="3"
          />
          <div style={styles.formButtons}>
            <button
              onClick={() => setShowJoinForm(false)}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  await joinGroup(groupId, joinMessage);
                  setShowJoinForm(false);
                  fetchGroupData();
                } catch (error) {
                  alert('Error sending request');
                }
              }}
              style={styles.submitButton}
            >
              Send Request
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('about')}
          style={{
            ...styles.tab,
            ...(activeTab === 'about' ? styles.activeTab : {}),
          }}
        >
          About
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          style={{
            ...styles.tab,
            ...(activeTab === 'discussions' ? styles.activeTab : {}),
          }}
        >
          Chat {discussions.length > 0 ? `(${discussions.length})` : ''}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('members')}
            style={{
              ...styles.tab,
              ...(activeTab === 'members' ? styles.activeTab : {}),
            }}
          >
            Members
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === 'about' && (
          <div style={styles.aboutSection}>
            <h3 style={styles.sectionTitle}>About this Group</h3>
            <p style={styles.description}>{group.description}</p>
            
            {group.rules && (
              <>
                <h3 style={styles.sectionTitle}>Group Rules</h3>
                <p style={styles.rules}>{group.rules}</p>
              </>
            )}
            
            <h3 style={styles.sectionTitle}>Created By</h3>
            <p style={styles.creator}>{group.createdBy?.name}</p>
          </div>
        )}

        {activeTab === 'discussions' && isMember ? (
          <div>
            {selectedDiscussion ? (
              // Show GroupChat when a discussion is selected
              <GroupChat
                discussionId={selectedDiscussion.id}
                groupName={group.name}
                onBack={handleBackFromChat}
              />
            ) : (
              // Show discussions list
              <div>
                <div style={styles.discussionHeader}>
                  <h3 style={styles.sectionTitle}>Chat Rooms</h3>
                  <button
                    onClick={() => setShowDiscussionForm(!showDiscussionForm)}
                    style={styles.newDiscussionButton}
                  >
                    {showDiscussionForm ? 'Cancel' : '+ New Chat Room'}
                  </button>
                </div>

                {showDiscussionForm && (
                  <form onSubmit={handleCreateDiscussion} style={styles.discussionForm}>
                    <input
                      type="text"
                      placeholder="Chat Room Title"
                      value={newDiscussion.title}
                      onChange={(e) => setNewDiscussion({...newDiscussion, title: e.target.value})}
                      required
                      style={styles.input}
                    />
                    <textarea
                      placeholder="What's this chat room about?"
                      value={newDiscussion.content}
                      onChange={(e) => setNewDiscussion({...newDiscussion, content: e.target.value})}
                      required
                      style={styles.textarea}
                      rows="4"
                    />
                    <button type="submit" style={styles.submitButton}>
                      Create Chat Room
                    </button>
                  </form>
                )}

                <div style={styles.discussionsList}>
                  {discussions.length === 0 ? (
                    <p style={styles.emptyText}>No chat rooms yet. Create the first one!</p>
                  ) : (
                    discussions.map(disc => (
                      <div
                        key={disc.id}
                        onClick={() => setSelectedDiscussion(disc)}
                        style={styles.discussionCard}
                      >
                        <h4 style={styles.discussionTitle}>{disc.title}</h4>
                        <p style={styles.discussionPreview}>
                          {disc.content.substring(0, 100)}...
                        </p>
                        <div style={styles.discussionMeta}>
                          <span>By {disc.author?.name}</span>
                          <span>💬 {disc.replyCount || 0} messages</span>
                          <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'discussions' && !isMember ? (
          <div style={styles.privateMessage}>
            <p>Join this group to participate in chats.</p>
          </div>
        ) : null}

        {activeTab === 'members' && isAdmin && (
          <div>
            <h3 style={styles.sectionTitle}>Members</h3>
            <div style={styles.membersList}>
              {group.members?.map(member => (
                <div key={member.id} style={styles.memberCard}>
                  <div style={styles.memberInfo}>
                    <span style={styles.memberName}>{member.member.name}</span>
                    <span style={styles.memberRole}>
                      {member.role === 'admin' ? '👑 Admin' : 
                       member.role === 'moderator' ? '🛡️ Moderator' : 'Member'}
                    </span>
                    {member.status === 'pending' && (
                      <span style={styles.pendingBadge}>Pending</span>
                    )}
                  </div>
                  
                  {member.status === 'pending' && (
                    <div style={styles.memberActions}>
                      <button
                        onClick={() => handleApproveMember(member.memberId)}
                        style={styles.approveButton}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectMember(member.memberId)}
                        style={styles.rejectButton}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
  error: {
    textAlign: 'center',
    padding: '50px',
    color: '#c33',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  leaveButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  groupCard: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '30px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  groupHeader: {
    marginBottom: '20px',
  },
  category: {
    fontSize: '12px',
    color: '#667eea',
    backgroundColor: '#f0f4ff',
    padding: '4px 8px',
    borderRadius: '4px',
    marginRight: '10px',
  },
  privateBadge: {
    fontSize: '11px',
    color: '#f59e0b',
    backgroundColor: '#fff3e0',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  groupName: {
    margin: '10px 0',
    color: '#333',
    fontSize: '28px',
  },
  groupMeta: {
    display: 'flex',
    gap: '20px',
    color: '#666',
    fontSize: '14px',
  },
  joinSection: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
  },
  joinText: {
    marginBottom: '10px',
    color: '#333',
  },
  joinButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  pendingSection: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff3e0',
    borderRadius: '8px',
  },
  pendingBadge: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  joinForm: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  formTitle: {
    margin: '0 0 15px 0',
    color: '#333',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  activeTab: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '30px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  aboutSection: {
    lineHeight: '1.6',
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '15px',
  },
  description: {
    color: '#666',
    marginBottom: '30px',
  },
  rules: {
    color: '#666',
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  creator: {
    color: '#667eea',
  },
  discussionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  newDiscussionButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  discussionForm: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  discussionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  discussionCard: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
  discussionTitle: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  discussionPreview: {
    color: '#666',
    marginBottom: '10px',
  },
  discussionMeta: {
    display: 'flex',
    gap: '15px',
    fontSize: '12px',
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
  },
  privateMessage: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  memberCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  memberName: {
    fontWeight: '500',
    color: '#333',
  },
  memberRole: {
    fontSize: '12px',
    color: '#667eea',
  },
  memberActions: {
    display: 'flex',
    gap: '10px',
  },
  approveButton: {
    padding: '5px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  rejectButton: {
    padding: '5px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default GroupDetail;