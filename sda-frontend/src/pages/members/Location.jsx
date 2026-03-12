// src/pages/members/Location.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateLocation, findNearbyUsers, getLocationStats } from '../../services/api';

function Location() {
  const { user } = useAuth();
  const [location, setLocation] = useState({
    city: user?.city || '',
    region: user?.region || '',
    country: user?.country || 'Kenya',
    showLocation: user?.showLocation !== false,
  });
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.city) {
      fetchNearbyUsers(user.city);
      fetchStats(user.city);
    }
  }, [user]);

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      await updateLocation(location);
      setMessage('✅ Location updated successfully!');
      if (location.city) {
        fetchNearbyUsers(location.city);
        fetchStats(location.city);
      }
    } catch (error) {
      setMessage('❌ Error updating location');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async (city) => {
    try {
      const response = await findNearbyUsers(city);
      setNearbyUsers(response.data);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    }
  };

  const fetchStats = async (city) => {
    try {
      const response = await getLocationStats(city);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📍 Location Settings</h2>

      {/* Update Location Form */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Your Location</h3>
        <form onSubmit={handleUpdateLocation}>
          <div style={styles.formGroup}>
            <label style={styles.label}>City</label>
            <input
              type="text"
              value={location.city}
              onChange={(e) => setLocation({...location, city: e.target.value})}
              placeholder="e.g., Nairobi"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Region (Optional)</label>
            <input
              type="text"
              value={location.region}
              onChange={(e) => setLocation({...location, region: e.target.value})}
              placeholder="e.g., Nairobi County"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Country</label>
            <input
              type="text"
              value={location.country}
              onChange={(e) => setLocation({...location, country: e.target.value})}
              placeholder="Kenya"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={location.showLocation}
                onChange={(e) => setLocation({...location, showLocation: e.target.checked})}
              />
              Allow others to see my general location
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={styles.button}
          >
            {loading ? 'Updating...' : 'Update Location'}
          </button>
          
          {message && <p style={styles.message}>{message}</p>}
        </form>
      </div>

      {/* Location Stats */}
      {stats && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Youth in {stats.city}</h3>
          <div style={styles.statBox}>
            <span style={styles.statNumber}>{stats.members}</span>
            <span style={styles.statLabel}>members</span>
          </div>
        </div>
      )}

      {/* Nearby Users */}
      {nearbyUsers.length > 0 && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>👥 Youth Near You</h3>
          <div style={styles.userList}>
            {nearbyUsers.map(user => (
              <div key={user.id} style={styles.userCard}>
                <h4 style={styles.userName}>{user.name}</h4>
                {user.age && <p style={styles.userDetail}>Age: {user.age}</p>}
                {user.bio && <p style={styles.userBio}>{user.bio}</p>}
                <p style={styles.userLocation}>📍 {user.city}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
  },
  title: {
    color: '#333',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    margin: '0 0 20px 0',
    color: '#444',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontWeight: '500',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#555',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ddd',
    fontSize: '16px',
  },
  button: {
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    marginTop: '10px',
  },
  message: {
    marginTop: '15px',
    padding: '10px',
    borderRadius: '5px',
    textAlign: 'center',
  },
  statBox: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f0f4ff',
    borderRadius: '8px',
  },
  statNumber: {
    display: 'block',
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: '16px',
    color: '#666',
  },
  userList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px',
  },
  userCard: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  userName: {
    margin: '0 0 10px 0',
    color: '#333',
  },
  userDetail: {
    margin: '5px 0',
    color: '#666',
    fontSize: '14px',
  },
  userBio: {
    margin: '10px 0',
    color: '#555',
    fontStyle: 'italic',
  },
  userLocation: {
    margin: '10px 0 0 0',
    color: '#667eea',
    fontSize: '13px',
  },
};

export default Location;