// src/pages/admin/maintenance/SystemHealth.jsx
import React, { useState, useEffect } from 'react';
import { getSystemHealth, clearCache, getDatabaseStats, optimizeDatabase } from '../../../services/api';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('health');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchAllData();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllData(true);
      }, 30000); // Refresh every 30 seconds
      
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const fetchAllData = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchHealth(silent),
        fetchDatabaseStats(silent),
      ]);
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || 'Failed to load system health');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchHealth = async (silent = false) => {
    try {
      const response = await getSystemHealth();
      setHealth(response.data);
    } catch (err) {
      throw err;
    }
  };

  const fetchDatabaseStats = async (silent = false) => {
    try {
      const response = await getDatabaseStats();
      setDbStats(response.data);
    } catch (err) {
      throw err;
    }
  };

  const handleClearCache = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await clearCache();
      setSuccess('Cache cleared successfully!');
      fetchHealth(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear cache');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await optimizeDatabase();
      setSuccess('Database optimized successfully!');
      fetchDatabaseStats(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to optimize database');
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    
    return parts.join(' ') || '0s';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#27ae60';
      case 'degraded': return '#f39c12';
      case 'unhealthy': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (loading && !health && !dbStats) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading system health...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>🏥 System Health</h3>
        <div style={styles.headerControls}>
          <label style={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={() => fetchAllData()}
            disabled={loading}
            style={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {health && (
        <div style={{
          ...styles.statusBanner,
          backgroundColor: getStatusColor(health.status),
        }}>
          <span style={styles.statusIcon}>
            {health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '🔴'}
          </span>
          <span style={styles.statusText}>
            System Status: <strong>{health.status?.toUpperCase()}</strong>
          </span>
          <span style={styles.statusTime}>
            Last updated: {new Date(health.timestamp).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div style={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={styles.success}>
          <span>✅</span>
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('health')}
          style={{
            ...styles.tab,
            ...(activeTab === 'health' ? styles.activeTab : {}),
          }}
        >
          Health Overview
        </button>
        <button
          onClick={() => setActiveTab('database')}
          style={{
            ...styles.tab,
            ...(activeTab === 'database' ? styles.activeTab : {}),
          }}
        >
          Database Stats
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          style={{
            ...styles.tab,
            ...(activeTab === 'performance' ? styles.activeTab : {}),
          }}
        >
          Performance
        </button>
      </div>

      {/* Health Overview Tab */}
      {activeTab === 'health' && health && (
        <div style={styles.tabContent}>
          <div style={styles.healthGrid}>
            {/* Database Status */}
            <div style={styles.healthCard}>
              <h4 style={styles.cardTitle}>🗄️ Database</h4>
              <div style={styles.healthMetric}>
                <span style={styles.metricLabel}>Status:</span>
                <span style={{
                  ...styles.metricValue,
                  color: health.database?.status === 'healthy' ? '#27ae60' : '#e74c3c',
                }}>
                  {health.database?.status}
                </span>
              </div>
              <div style={styles.healthMetric}>
                <span style={styles.metricLabel}>Latency:</span>
                <span style={styles.metricValue}>{health.database?.latency}</span>
              </div>
            </div>

            {/* Server Stats */}
            <div style={styles.healthCard}>
              <h4 style={styles.cardTitle}>⚙️ Server</h4>
              <div style={styles.healthMetric}>
                <span style={styles.metricLabel}>Uptime:</span>
                <span style={styles.metricValue}>{formatUptime(health.stats?.uptime)}</span>
              </div>
              <div style={styles.healthMetric}>
                <span style={styles.metricLabel}>Memory Usage:</span>
                <span style={styles.metricValue}>
                  {formatBytes(health.stats?.memory?.heapUsed)} / {formatBytes(health.stats?.memory?.heapTotal)}
                </span>
              </div>
            </div>

            {/* User Stats */}
            <div style={styles.healthCard}>
              <h4 style={styles.cardTitle}>👥 Users</h4>
              <div style={styles.healthMetric}>
                <span style={styles.metricLabel}>Total Users:</span>
                <span style={styles.metricValue}>{health.stats?.totalUsers}</span>
              </div>
              <div style={styles.healthMetric}>
                <span style={styles.metricLabel}>Active Today:</span>
                <span style={styles.metricValue}>{health.stats?.activeToday}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.actionsCard}>
            <h4 style={styles.cardTitle}>🛠️ Quick Actions</h4>
            <div style={styles.actionButtons}>
              <button
                onClick={handleClearCache}
                disabled={actionLoading}
                style={styles.actionButton}
              >
                {actionLoading ? 'Clearing...' : 'Clear Cache'}
              </button>
              <button
                onClick={handleOptimizeDatabase}
                disabled={actionLoading}
                style={styles.actionButton}
              >
                {actionLoading ? 'Optimizing...' : 'Optimize Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Stats Tab */}
      {activeTab === 'database' && dbStats && (
        <div style={styles.tabContent}>
          <div style={styles.dbStatsGrid}>
            <div style={styles.dbStatCard}>
              <span style={styles.dbStatValue}>{dbStats.totalRecords?.toLocaleString()}</span>
              <span style={styles.dbStatLabel}>Total Records</span>
            </div>
            <div style={styles.dbStatCard}>
              <span style={styles.dbStatValue}>{dbStats.tables?.length || 0}</span>
              <span style={styles.dbStatLabel}>Tables</span>
            </div>
            <div style={styles.dbStatCard}>
              <span style={styles.dbStatValue}>{dbStats.databaseSize}</span>
              <span style={styles.dbStatLabel}>Database Size</span>
            </div>
          </div>

          <h4 style={styles.sectionTitle}>Table Statistics</h4>
          <div style={styles.tableStats}>
            {dbStats.tables?.map((table, index) => (
              <div key={index} style={styles.tableRow}>
                <span style={styles.tableName}>{table.table}</span>
                <div style={styles.tableBar}>
                  <div style={{
                    ...styles.tableBarFill,
                    width: `${(table.count / Math.max(...dbStats.tables.map(t => t.count))) * 100}%`,
                  }} />
                </div>
                <span style={styles.tableCount}>{table.count.toLocaleString()} rows</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleOptimizeDatabase}
            disabled={actionLoading}
            style={styles.optimizeButton}
          >
            {actionLoading ? 'Optimizing...' : '🔄 Optimize Database'}
          </button>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && health && (
        <div style={styles.tabContent}>
          <div style={styles.performanceGrid}>
            {/* Memory Usage Chart */}
            <div style={styles.performanceCard}>
              <h4 style={styles.cardTitle}>📊 Memory Usage</h4>
              <div style={styles.memoryChart}>
                <div style={styles.memoryBar}>
                  <div style={{
                    ...styles.memoryFill,
                    width: `${(health.stats?.memory?.heapUsed / health.stats?.memory?.heapTotal) * 100}%`,
                  }} />
                </div>
                <div style={styles.memoryLabels}>
                  <span>Used: {formatBytes(health.stats?.memory?.heapUsed)}</span>
                  <span>Total: {formatBytes(health.stats?.memory?.heapTotal)}</span>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div style={styles.performanceCard}>
              <h4 style={styles.cardTitle}>⏱️ Response Time</h4>
              <div style={styles.responseTime}>
                <span style={styles.responseValue}>~45ms</span>
                <span style={styles.responseLabel}>Average API response</span>
              </div>
            </div>

            {/* Request Rate */}
            <div style={styles.performanceCard}>
              <h4 style={styles.cardTitle}>📈 Request Rate</h4>
              <div style={styles.requestRate}>
                <span style={styles.rateValue}>~120</span>
                <span style={styles.rateLabel}>requests/minute</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div style={styles.recommendationsCard}>
            <h4 style={styles.cardTitle}>💡 Recommendations</h4>
            <ul style={styles.recommendationsList}>
              {health.status === 'degraded' && (
                <li>⚠️ System performance is degraded - consider scaling resources</li>
              )}
              {health.stats?.memory?.heapUsed / health.stats?.memory?.heapTotal > 0.8 && (
                <li>⚠️ High memory usage detected - consider increasing memory limit</li>
              )}
              {dbStats?.totalRecords > 10000 && (
                <li>📊 Database growing - consider implementing archiving strategy</li>
              )}
              <li>✅ Regular cache clearing improves performance</li>
              <li>✅ Database optimization recommended weekly</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: '#666',
  },
  loadingSpinner: {
    width: '30px',
    height: '30px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
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
    fontSize: '18px',
    fontWeight: '600',
  },
  headerControls: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  autoRefreshLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '13px',
    color: '#666',
    cursor: 'pointer',
  },
  refreshButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    borderRadius: '5px',
    color: 'white',
    marginBottom: '20px',
  },
  statusIcon: {
    fontSize: '20px',
  },
  statusText: {
    flex: 1,
    fontSize: '14px',
  },
  statusTime: {
    fontSize: '12px',
    opacity: 0.9,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px',
  },
  tab: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#666',
    fontSize: '13px',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  activeTab: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  tabContent: {
    marginTop: '20px',
  },
  healthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  healthCard: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  cardTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '15px',
    fontWeight: '600',
  },
  healthMetric: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  metricLabel: {
    fontSize: '13px',
    color: '#666',
  },
  metricValue: {
    fontSize: '13px',
    fontWeight: '500',
  },
  actionsCard: {
    padding: '20px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#5a6fd8',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  dbStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '25px',
  },
  dbStatCard: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    textAlign: 'center',
  },
  dbStatValue: {
    display: 'block',
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '5px',
  },
  dbStatLabel: {
    fontSize: '12px',
    color: '#666',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    color: '#333',
    fontSize: '15px',
  },
  tableStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  tableName: {
    width: '150px',
    fontSize: '13px',
    color: '#666',
    textTransform: 'capitalize',
  },
  tableBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  tableBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  tableCount: {
    width: '80px',
    fontSize: '12px',
    color: '#333',
    textAlign: 'right',
  },
  optimizeButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e67e22',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
  },
  performanceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  performanceCard: {
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  memoryChart: {
    marginTop: '10px',
  },
  memoryBar: {
    height: '20px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  memoryFill: {
    height: '100%',
    backgroundColor: '#667eea',
    transition: 'width 0.3s',
  },
  memoryLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
  },
  responseTime: {
    textAlign: 'center',
    padding: '10px',
  },
  responseValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '5px',
  },
  responseLabel: {
    fontSize: '12px',
    color: '#666',
  },
  requestRate: {
    textAlign: 'center',
    padding: '10px',
  },
  rateValue: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '5px',
  },
  rateLabel: {
    fontSize: '12px',
    color: '#666',
  },
  recommendationsCard: {
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
  },
  recommendationsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#856404',
    fontSize: '13px',
    lineHeight: '1.8',
  },
};

export default SystemHealth;