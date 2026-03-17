// src/components/groups/EventCard.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RSVP_STATUS = {
  GOING: 'going',
  MAYBE: 'maybe',
  NOT_GOING: 'not-going'
};

function EventCard({ event, onRSVP, onEdit, onDelete, isAdmin = false }) {
  const { user } = useAuth();
  const [showRSVPMenu, setShowRSVPMenu] = useState(false);
  
  const userAttendance = event.attendees?.find(a => a.memberId === user?.id);
  const userStatus = userAttendance?.status;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getRSVPCounts = () => {
    const going = event.attendees?.filter(a => a.status === 'going').length || 0;
    const maybe = event.attendees?.filter(a => a.status === 'maybe').length || 0;
    return { going, maybe };
  };
  
  const { going, maybe } = getRSVPCounts();
  
  const handleRSVP = (status) => {
    onRSVP(event.id, status);
    setShowRSVPMenu(false);
  };
  
  const getStatusBadge = () => {
    if (!userStatus) return null;
    
    const badges = {
      going: { text: '✅ Going', color: '#28a745' },
      maybe: { text: '🤔 Maybe', color: '#ffc107' },
      'not-going': { text: '❌ Not Going', color: '#dc3545' }
    };
    
    return (
      <span style={{
        ...styles.statusBadge,
        backgroundColor: badges[userStatus].color
      }}>
        {badges[userStatus].text}
      </span>
    );
  };
  
  return (
    <div style={styles.card}>
      {/* Event Date Badge */}
      <div style={styles.dateBadge}>
        <div style={styles.dateMonth}>
          {new Date(event.date).toLocaleString('default', { month: 'short' })}
        </div>
        <div style={styles.dateDay}>
          {new Date(event.date).getDate()}
        </div>
      </div>
      
      {/* Event Details */}
      <div style={styles.content}>
        <div style={styles.header}>
          <h3 style={styles.title}>{event.title}</h3>
          {getStatusBadge()}
        </div>
        
        <p style={styles.description}>{event.description}</p>
        
        <div style={styles.details}>
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>🕐</span>
            <span>{formatTime(event.date)}</span>
          </div>
          
          {event.endDate && (
            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>⏱️</span>
              <span>Until {formatTime(event.endDate)}</span>
            </div>
          )}
          
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>
              {event.isOnline ? '💻' : '📍'}
            </span>
            <span>
              {event.isOnline ? 'Online' : event.location}
            </span>
          </div>
          
          {event.isOnline && event.meetingLink && (
            <div style={styles.detailItem}>
              <span style={styles.detailIcon}>🔗</span>
              <a 
                href={event.meetingLink} 
                target="_blank" 
                rel="noopener noreferrer"
                style={styles.link}
              >
                Join Meeting
              </a>
            </div>
          )}
        </div>
        
        {/* RSVP Section */}
        <div style={styles.rsvpSection}>
          <div style={styles.rsvpStats}>
            <span style={styles.rsvpStat}>✅ {going} going</span>
            <span style={styles.rsvpStat}>🤔 {maybe} maybe</span>
          </div>
          
          <div style={styles.rsvpActions}>
            <button
              onClick={() => setShowRSVPMenu(!showRSVPMenu)}
              style={styles.rsvpButton}
            >
              {userStatus ? 'Change RSVP' : 'RSVP'}
            </button>
            
            {showRSVPMenu && (
              <div style={styles.rsvpMenu}>
                <button
                  onClick={() => handleRSVP('going')}
                  style={styles.rsvpMenuItem}
                >
                  ✅ Going
                </button>
                <button
                  onClick={() => handleRSVP('maybe')}
                  style={styles.rsvpMenuItem}
                >
                  🤔 Maybe
                </button>
                <button
                  onClick={() => handleRSVP('not-going')}
                  style={styles.rsvpMenuItem}
                >
                  ❌ Not Going
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Admin Actions */}
        {isAdmin && (
          <div style={styles.adminActions}>
            <button
              onClick={() => onEdit(event)}
              style={styles.editButton}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onDelete(event.id)}
              style={styles.deleteButton}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '15px',
    gap: '20px',
  },
  dateBadge: {
    minWidth: '60px',
    height: '60px',
    backgroundColor: '#667eea',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
  },
  dateMonth: {
    fontSize: '14px',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  dateDay: {
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#333',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  description: {
    margin: '0 0 15px 0',
    color: '#666',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '15px',
    backgroundColor: '#f9f9f9',
    padding: '12px',
    borderRadius: '8px',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#555',
  },
  detailIcon: {
    fontSize: '16px',
    minWidth: '24px',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  rsvpSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  rsvpStats: {
    display: 'flex',
    gap: '15px',
  },
  rsvpStat: {
    fontSize: '13px',
    color: '#666',
  },
  rsvpActions: {
    position: 'relative',
  },
  rsvpButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  rsvpMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '8px',
    zIndex: 10,
    minWidth: '150px',
  },
  rsvpMenuItem: {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    fontSize: '13px',
    cursor: 'pointer',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  adminActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#666',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#fee',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    color: '#c33',
  },
};

export default EventCard;