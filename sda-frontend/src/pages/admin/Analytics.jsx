// src/pages/admin/Analytics.jsx
import { useState, useEffect } from 'react';
import { getAnalytics, getUserGrowth, getDemographics, getContentAnalytics, getEngagementMetrics } from '../../services/api';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [contentStats, setContentStats] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    try {
      const [growthRes, demoRes, contentRes, engagementRes] = await Promise.all([
        getUserGrowth('monthly'),
        getDemographics(),
        getContentAnalytics(),
        getEngagementMetrics(30)
      ]);
      
      setUserGrowth(growthRes.data);
      setDemographics(demoRes.data);
      setContentStats(contentRes.data);
      setEngagement(engagementRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsByDate = async () => {
    setLoading(true);
    try {
      const response = await getAnalytics(dateRange.start, dateRange.end);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading analytics...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📈 Analytics Dashboard</h2>
        <div style={styles.dateRangePicker}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            style={styles.dateInput}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            style={styles.dateInput}
          />
          <button onClick={fetchAnalyticsByDate} style={styles.applyButton}>Apply</button>
        </div>
      </div>

      {/* User Growth Section */}
      {userGrowth && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>User Growth</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{userGrowth.total}</span>
              <span style={styles.statLabel}>Total Users</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{userGrowth.active30d}</span>
              <span style={styles.statLabel}>Active (30d)</span>
            </div>
          </div>
        </div>
      )}

      {/* Demographics Section */}
      {demographics && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>User Demographics</h3>
          <div style={styles.demographicsGrid}>
            <div style={styles.demographicCard}>
              <h4>Age Groups</h4>
              {Object.entries(demographics.ageGroups || {}).map(([group, count]) => (
                <div key={group} style={styles.demographicItem}>
                  <span>{group}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            <div style={styles.demographicCard}>
              <h4>Gender</h4>
              {Object.entries(demographics.gender || {}).map(([gender, count]) => (
                <div key={gender} style={styles.demographicItem}>
                  <span>{gender}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Stats Section */}
      {contentStats && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Content Statistics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{contentStats.totals?.forumPosts || 0}</span>
              <span style={styles.statLabel}>Forum Posts</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{contentStats.totals?.prayerRequests || 0}</span>
              <span style={styles.statLabel}>Prayer Requests</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{contentStats.totals?.testimonies || 0}</span>
              <span style={styles.statLabel}>Testimonies</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{contentStats.totals?.groups || 0}</span>
              <span style={styles.statLabel}>Groups</span>
            </div>
          </div>
        </div>
      )}

      {/* Engagement Section */}
      {engagement && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Engagement Metrics</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{engagement.dailyActive?.[0]?.activeUsers || 0}</span>
              <span style={styles.statLabel}>Daily Active</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{engagement.retention?.retentionRate?.toFixed(1) || 0}%</span>
              <span style={styles.statLabel}>Retention Rate</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    margin: 0,
    color: '#333',
    fontSize: '24px',
  },
  dateRangePicker: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateInput: {
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ddd',
  },
  applyButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#2980b9',
    },
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '18px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  demographicsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  demographicCard: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  demographicItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    color: '#666',
  },
};

export default Analytics;