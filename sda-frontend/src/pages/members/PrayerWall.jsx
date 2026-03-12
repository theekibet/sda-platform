// src/pages/members/PrayerWall.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPrayerRequests,
  getTrendingPrayers,
  getPrayerRequest, 
  createPrayerRequest,
  prayForRequest,
  getTestimonies,
  createTestimony,
  encourageTestimony,
} from '../../services/api';
import ReportButton from '../../components/Reports/ReportButton';
import { CONTENT_TYPES } from "../../utils/constants"; 

function PrayerWall() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('prayer');
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [trendingPrayers, setTrendingPrayers] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPrayerForm, setShowNewPrayerForm] = useState(false);
  const [showTestimonyForm, setShowTestimonyForm] = useState(false);
  
  const [newPrayer, setNewPrayer] = useState({
    content: '',
    isAnonymous: false,
  });

  const [newTestimony, setNewTestimony] = useState({
    title: '',
    content: '',
    prayerRequestId: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'prayer') {
        const [requestsRes, trendingRes] = await Promise.all([
          getPrayerRequests(user?.city),
          getTrendingPrayers(),
        ]);
        setPrayerRequests(requestsRes.data.requests || []);
        setTrendingPrayers(trendingRes.data || []);
      } else if (activeTab === 'testimonies') {
        const testimoniesRes = await getTestimonies();
        setTestimonies(testimoniesRes.data.testimonies || []);
      }
    } catch (error) {
      console.error('Error fetching prayer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrayer = async (e) => {
    e.preventDefault();
    try {
      await createPrayerRequest(newPrayer);
      setNewPrayer({ content: '', isAnonymous: false });
      setShowNewPrayerForm(false);
      fetchData();
    } catch (error) {
      alert('Error creating prayer request');
    }
  };

  const handlePray = async (requestId) => {
    try {
      await prayForRequest(requestId);
      if (selectedRequest && selectedRequest.id === requestId) {
        // Refresh selected request
        const updated = await getPrayerRequest(requestId);
        setSelectedRequest(updated.data);
      } else {
        fetchData();
      }
    } catch (error) {
      alert('Error praying for request');
    }
  };

  const handleViewRequest = async (requestId) => {
    try {
      const response = await getPrayerRequest(requestId);
      setSelectedRequest(response.data);
    } catch (error) {
      console.error('Error fetching request:', error);
    }
  };

  const handleCreateTestimony = async (e) => {
    e.preventDefault();
    try {
      await createTestimony(newTestimony);
      setNewTestimony({ title: '', content: '', prayerRequestId: '' });
      setShowTestimonyForm(false);
      fetchData();
    } catch (error) {
      alert('Error sharing testimony');
    }
  };

  const handleEncourage = async (testimonyId) => {
    try {
      await encourageTestimony(testimonyId);
      fetchData();
    } catch (error) {
      alert('Error encouraging testimony');
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

  if (loading && !selectedRequest) {
    return <div style={styles.loading}>Loading prayer wall...</div>;
  }

  return (
    <div style={styles.container}>
      {selectedRequest ? (
        // Single Prayer Request View
        <div>
          <button 
            onClick={() => setSelectedRequest(null)}
            style={styles.backButton}
          >
            ← Back to Prayer Wall
          </button>
          
          <div style={styles.requestDetail}>
            <div style={styles.requestHeader}>
              <div>
                <p style={styles.requestContent}>{selectedRequest.content}</p>
                <div style={styles.requestMeta}>
                  <span>
                    {selectedRequest.isAnonymous ? 'Anonymous' : selectedRequest.author?.name}
                  </span>
                  <span>•</span>
                  <span>{formatDate(selectedRequest.createdAt)}</span>
                  <span>•</span>
                  <span>📍 {selectedRequest.city || 'No location'}</span>
                </div>
              </div>
              {/* Report button for prayer request */}
              <ReportButton
                contentType={CONTENT_TYPES.PRAYER_REQUEST}
                contentId={selectedRequest.id}
                authorId={selectedRequest.author?.id}
                size="small"
              />
            </div>

            <div style={styles.prayerStats}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>{selectedRequest.prayedCount}</span>
                <span style={styles.statLabel}>prayers</span>
              </div>
            </div>

            <button
              onClick={() => handlePray(selectedRequest.id)}
              style={styles.prayButton}
            >
              🙏 Pray for This
            </button>

            {/* People who prayed */}
            {selectedRequest.prayers?.length > 0 && (
              <div style={styles.prayersList}>
                <h4 style={styles.sectionTitle}>Recently prayed for this</h4>
                <div style={styles.prayerAvatars}>
                  {selectedRequest.prayers.map(prayer => (
                    <div key={prayer.id} style={styles.prayerAvatar}>
                      {prayer.member.name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link to testimony */}
            <button
              onClick={() => {
                setNewTestimony({
                  ...newTestimony,
                  prayerRequestId: selectedRequest.id,
                  title: `Prayer Answered: ${selectedRequest.content.substring(0, 50)}...`
                });
                setShowTestimonyForm(true);
                setSelectedRequest(null);
                setActiveTab('testimonies');
              }}
              style={styles.shareTestimonyButton}
            >
              ✨ Share how this prayer was answered
            </button>
          </div>
        </div>
      ) : (
        // Prayer Wall Main View
        <div>
          <div style={styles.header}>
            <h2 style={styles.title}>🙏 Prayer Wall</h2>
            <button
              onClick={() => setShowNewPrayerForm(!showNewPrayerForm)}
              style={styles.newButton}
            >
              {showNewPrayerForm ? 'Cancel' : '+ Request Prayer'}
            </button>
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab('prayer')}
              style={{
                ...styles.tab,
                ...(activeTab === 'prayer' ? styles.activeTab : {}),
              }}
            >
              Prayer Requests
            </button>
            <button
              onClick={() => setActiveTab('testimonies')}
              style={{
                ...styles.tab,
                ...(activeTab === 'testimonies' ? styles.activeTab : {}),
              }}
            >
              ✨ Testimonies
            </button>
          </div>

          {/* New Prayer Form */}
          {showNewPrayerForm && (
            <form onSubmit={handleCreatePrayer} style={styles.newForm}>
              <h3 style={styles.formTitle}>Share a Prayer Request</h3>
              <textarea
                value={newPrayer.content}
                onChange={(e) => setNewPrayer({...newPrayer, content: e.target.value})}
                placeholder="What would you like prayer for?"
                required
                style={styles.textarea}
                rows="4"
              />
              <div style={styles.formRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newPrayer.isAnonymous}
                    onChange={(e) => setNewPrayer({...newPrayer, isAnonymous: e.target.checked})}
                  />
                  Post anonymously
                </label>
                <button type="submit" style={styles.submitButton}>
                  Share Prayer Request
                </button>
              </div>
            </form>
          )}

          {/* New Testimony Form */}
          {showTestimonyForm && (
            <form onSubmit={handleCreateTestimony} style={styles.newForm}>
              <h3 style={styles.formTitle}>✨ Share Your Testimony</h3>
              <input
                type="text"
                value={newTestimony.title}
                onChange={(e) => setNewTestimony({...newTestimony, title: e.target.value})}
                placeholder="Title (e.g., God Answered My Prayer)"
                required
                style={styles.input}
              />
              <textarea
                value={newTestimony.content}
                onChange={(e) => setNewTestimony({...newTestimony, content: e.target.value})}
                placeholder="Share what God has done..."
                required
                style={styles.textarea}
                rows="5"
              />
              <div style={styles.formRow}>
                <button type="submit" style={styles.submitButton}>
                  Share Testimony
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowTestimonyForm(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Content based on active tab */}
          {activeTab === 'prayer' ? (
            <div>
              {/* Trending Prayers */}
              {trendingPrayers.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>🔥 Trending Prayers</h3>
                  <div style={styles.trendingList}>
                    {trendingPrayers.map(request => (
                      <div 
                        key={request.id} 
                        style={styles.trendingCard}
                        onClick={() => handleViewRequest(request.id)}
                      >
                        <p style={styles.trendingContent}>
                          {request.content.length > 100 
                            ? request.content.substring(0, 100) + '...' 
                            : request.content}
                        </p>
                        <div style={styles.trendingMeta}>
                          <span>🙏 {request.prayedCount}</span>
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        {/* Report button for trending prayer */}
                        <div style={styles.trendingReport}>
                          <ReportButton
                            contentType={CONTENT_TYPES.PRAYER_REQUEST}
                            contentId={request.id}
                            authorId={request.author?.id}
                            size="small"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Prayer Requests */}
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Recent Prayer Requests</h3>
                {prayerRequests.length === 0 ? (
                  <p style={styles.emptyText}>No prayer requests yet. Be the first to share!</p>
                ) : (
                  <div style={styles.requestsList}>
                    {prayerRequests.map(request => (
                      <div 
                        key={request.id} 
                        style={styles.requestCard}
                        onClick={() => handleViewRequest(request.id)}
                      >
                        <div style={styles.requestHeader}>
                          <p style={styles.requestContent}>
                            {request.content.length > 150 
                              ? request.content.substring(0, 150) + '...' 
                              : request.content}
                          </p>
                          {/* Report button for prayer request */}
                          <ReportButton
                            contentType={CONTENT_TYPES.PRAYER_REQUEST}
                            contentId={request.id}
                            authorId={request.author?.id}
                            size="small"
                          />
                        </div>
                        <div style={styles.requestFooter}>
                          <div style={styles.requestMeta}>
                            <span>
                              {request.isAnonymous ? 'Anonymous' : request.author?.name}
                            </span>
                            <span>•</span>
                            <span>{formatDate(request.createdAt)}</span>
                            {request.city && (
                              <>
                                <span>•</span>
                                <span>📍 {request.city}</span>
                              </>
                            )}
                          </div>
                          <div style={styles.prayerCount}>
                            🙏 {request.prayedCount}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Testimonies Tab
            <div>
              <div style={styles.header}>
                <h3 style={styles.sectionTitle}>✨ Testimonies</h3>
                <button
                  onClick={() => setShowTestimonyForm(true)}
                  style={styles.newButton}
                >
                  + Share Testimony
                </button>
              </div>
              {testimonies.length === 0 ? (
                <p style={styles.emptyText}>No testimonies yet. Share how God has worked in your life!</p>
              ) : (
                <div style={styles.testimoniesList}>
                  {testimonies.map(testimony => (
                    <div key={testimony.id} style={styles.testimonyCard}>
                      <div style={styles.testimonyHeader}>
                        <h4 style={styles.testimonyTitle}>{testimony.title}</h4>
                        {/* Report button for testimony */}
                        <ReportButton
                          contentType={CONTENT_TYPES.TESTIMONY}
                          contentId={testimony.id}
                          authorId={testimony.author?.id}
                          size="small"
                        />
                      </div>
                      <p style={styles.testimonyContent}>{testimony.content}</p>
                      <div style={styles.testimonyFooter}>
                        <div style={styles.testimonyMeta}>
                          <span>{testimony.author?.name}</span>
                          <span>•</span>
                          <span>{formatDate(testimony.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => handleEncourage(testimony.id)}
                          style={styles.encourageButton}
                        >
                          ❤️ Encourage ({testimony.encouragedCount || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    color: '#333',
  },
  newButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
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
    padding: '8px 16px',
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
  newForm: {
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
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '15px',
  },
  trendingList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px',
  },
  trendingCard: {
    backgroundColor: '#f0f4ff',
    padding: '15px',
    borderRadius: '8px',
    cursor: 'pointer',
    position: 'relative',
  },
  trendingContent: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  trendingMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
  },
  trendingReport: {
    position: 'absolute',
    top: '5px',
    right: '5px',
  },
  requestsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  requestCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  requestContent: {
    margin: '0 0 15px 0',
    color: '#444',
    lineHeight: '1.6',
    flex: 1,
  },
  requestFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#999',
  },
  prayerCount: {
    fontSize: '14px',
    color: '#667eea',
  },
  emptyText: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
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
  requestDetail: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  prayerStats: {
    marginBottom: '20px',
  },
  statBox: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  prayButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  shareTestimonyButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  prayersList: {
    marginTop: '20px',
  },
  prayerAvatars: {
    display: 'flex',
    gap: '5px',
    marginTop: '10px',
  },
  prayerAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  testimoniesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  testimonyCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  testimonyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  testimonyTitle: {
    margin: 0,
    color: '#333',
    flex: 1,
  },
  testimonyContent: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '15px',
  },
  testimonyFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimonyMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: '#999',
  },
  encourageButton: {
    padding: '5px 10px',
    backgroundColor: 'transparent',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default PrayerWall;