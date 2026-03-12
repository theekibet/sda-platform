// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/public/LandingPage';
import Login from './components/members/Login';
import Register from './components/members/Register';
import Dashboard from './pages/members/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Forum from './pages/members/Forum';
import PrayerWall from './pages/members/PrayerWall';
import Profile from './pages/members/Profile';
import Location from './pages/members/Location';
import GroupsList from './pages/members/groups/GroupsList';
import GroupDetail from './pages/members/groups/GroupDetail';

// ✅ Bible Components
import BibleReader from './components/bible/BibleReader';
import VerseOfTheDay from './components/bible/VerseOfTheDay';
import VerseBrowser from './components/bible/VerseBrowser';
import VerseQueueStatus from './components/bible/VerseQueueStatus';
import MySubmissions from './pages/members/MySubmissions';

// ✅ Admin Components
import ModerationQueue from './pages/admin/moderation/ModerationQueue';
import AnnouncementList from './pages/admin/announcements/AnnouncementList';
import SettingsPanel from './pages/admin/settings/SettingsPanel';
import IPBlocking from './pages/admin/security/IPBlocking';
import Sessions from './pages/admin/security/Sessions';
import LoginAttempts from './pages/admin/security/LoginAttempts';
import BackupManager from './pages/admin/maintenance/BackupManager';
import SystemHealth from './pages/admin/maintenance/SystemHealth';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import AdminVerseQueue from './pages/admin/Admin/Bible/AdminVerseQueue'; 

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes - NO Layout */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Member Routes - WITH Layout */}
      <Route path="/dashboard" element={
        <Layout>
          <Dashboard />
        </Layout>
      } />
      
      <Route path="/forum" element={
        <Layout>
          <Forum />
        </Layout>
      } />
      
      <Route path="/prayer-wall" element={
        <Layout>
          <PrayerWall />
        </Layout>
      } />
      
      <Route path="/profile" element={
        <Layout>
          <Profile />
        </Layout>
      } />
      
      <Route path="/location" element={
        <Layout>
          <Location />
        </Layout>
      } />
      
      <Route path="/groups" element={
        <Layout>
          <GroupsList />
        </Layout>
      } />
      
      <Route path="/groups/:groupId" element={
        <Layout>
          <GroupDetail />
        </Layout>
      } />

      {/* Bible Routes - Available to all logged-in users */}
      <Route path="/bible/reader" element={
        <Layout>
          <BibleReader />
        </Layout>
      } />

      <Route path="/bible/verse-of-day" element={
        <Layout>
          <VerseOfTheDay />
        </Layout>
      } />

      <Route path="/bible/search" element={
        <Layout>
          <VerseBrowser />
        </Layout>
      } />

      <Route path="/bible/queue" element={
        <Layout>
          <VerseQueueStatus />
        </Layout>
      } />
      
      <Route path="/my-submissions" element={
        <Layout>
          <MySubmissions />
        </Layout>
      } />

      <Route path="/bible/bookmarks" element={
        <Layout>
          <div style={styles.comingSoon}>
            <h2>🔖 My Bookmarks</h2>
            <p>Bookmarks feature coming soon!</p>
          </div>
        </Layout>
      } />

      {/* Admin Routes - All with Layout and admin protection */}
      <Route path="/admin/dashboard" element={
        <Layout>
          <AdminDashboard />
        </Layout>
      } />

      <Route path="/admin/users" element={
        <Layout>
          <UserManagement />
        </Layout>
      } />

      <Route path="/admin/moderation" element={
        <Layout>
          <ModerationQueue />
        </Layout>
      } />

      <Route path="/admin/bible/queue" element={  // ✅ ADD THIS ROUTE
        <Layout>
          <AdminVerseQueue />
        </Layout>
      } />

      <Route path="/admin/announcements" element={
        <Layout>
          <AnnouncementList />
        </Layout>
      } />

      <Route path="/admin/analytics" element={
        <Layout>
          <Analytics />
        </Layout>
      } />

      <Route path="/admin/settings" element={
        <Layout>
          <SettingsPanel />
        </Layout>
      } />

      <Route path="/admin/security/ip" element={
        <Layout>
          <IPBlocking />
        </Layout>
      } />

      <Route path="/admin/security/sessions" element={
        <Layout>
          <Sessions />
        </Layout>
      } />

      <Route path="/admin/security/attempts" element={
        <Layout>
          <LoginAttempts />
        </Layout>
      } />

      <Route path="/admin/backups" element={
        <Layout>
          <BackupManager />
        </Layout>
      } />

      <Route path="/admin/health" element={
        <Layout>
          <SystemHealth />
        </Layout>
      } />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gap: '20px',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255, 255, 255, 0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: '500',
  },
  comingSoon: {
    textAlign: 'center',
    padding: '50px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    color: '#666',
  },
};

// Add keyframe animation
const styleSheet = document.styleSheets[0];
const keyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default App;