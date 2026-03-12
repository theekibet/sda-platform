// src/pages/members/Dashboard.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Home from './Home';
import Profile from './Profile';
import Forum from './Forum';
import Location from './Location';
import PrayerWall from './PrayerWall';
import GroupsList from './groups/GroupsList';
import GroupDetail from './groups/GroupDetail';
import AnnouncementBanner from '../admin/announcements/AnnouncementBanner';
import VerseOfTheDay from '../../components/bible/VerseOfTheDay';
import VerseQueueStatus from '../../components/bible/VerseQueueStatus';
import BibleReader from '../../components/bible/BibleReader';

function Dashboard() {
  const { user } = useAuth();
  // Get the current page from URL instead of tabs
  const path = window.location.pathname;
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showBibleReader, setShowBibleReader] = useState(false);

  // Determine which component to show based on URL
  const getContent = () => {
    if (path.includes('/forum')) return <Forum />;
    if (path.includes('/prayer-wall')) return <PrayerWall />;
    if (path.includes('/groups')) {
      if (selectedGroupId) return <GroupDetail groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
      return <GroupsList onViewGroup={setSelectedGroupId} />;
    }
    if (path.includes('/location')) return <Location />;
    if (path.includes('/profile')) return <Profile />;
    return <Home />; // default
  };

  const handleViewGroup = (groupId) => {
    setSelectedGroupId(groupId);
    window.location.href = '/groups'; // Navigate to groups page
  };

  const handleBackFromGroup = () => {
    setSelectedGroupId(null);
    window.location.href = '/groups';
  };

  const handleAnnouncementView = (announcementId) => {
    console.log('Announcement viewed:', announcementId);
  };

  const handleOpenBible = () => {
    setShowBibleReader(true);
  };

  const handleCloseBible = () => {
    setShowBibleReader(false);
  };

  return (
    <div style={styles.container}>
      {/* Bible Reader Modal */}
      {showBibleReader && (
        <BibleReader onClose={handleCloseBible} />
      )}

      {/* Verse of the Day */}
      <VerseOfTheDay />

      {/* Queue Status */}
      {user && (
        <div style={styles.queueSection}>
          <VerseQueueStatus />
        </div>
      )}

      {/* Announcement Banner */}
      <AnnouncementBanner onView={handleAnnouncementView} />

      {/* Content - Now controlled by sidebar navigation */}
      <div style={styles.content}>
        {getContent()}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  queueSection: {
    marginBottom: '20px',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minHeight: '500px',
  },
};

export default Dashboard;