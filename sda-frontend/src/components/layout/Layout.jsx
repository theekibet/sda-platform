// src/components/layout/Layout.jsx
import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={styles.layout}>
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div style={styles.mainContainer}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main style={styles.mainContent}>
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

const styles = {
  layout: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  mainContainer: {
    display: 'flex',
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: '20px',
    backgroundColor: '#f5f7fa',
    minHeight: 'calc(100vh - 70px)', // Subtract navbar height
  },
};

export default Layout;