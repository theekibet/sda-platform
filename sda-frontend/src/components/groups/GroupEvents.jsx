// src/components/groups/GroupEvents.jsx
import { useState, useEffect } from 'react';
import { groupsService } from "../../services/groupsService";
import EventCard from './EventCard';
import CreateEvent from './CreateEvent';

function GroupEvents({ groupId, isAdmin = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'
  
  useEffect(() => {
    fetchEvents();
  }, [groupId, filter]);
  
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await groupsService.getGroupEvents(groupId);
      const eventsData = response.data?.data || response.data || [];
      
      // Filter events based on selected filter
      const now = new Date();
      const filtered = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        if (filter === 'upcoming') return eventDate >= now;
        if (filter === 'past') return eventDate < now;
        return true; // 'all'
      });
      
      // Sort by date
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setEvents(filtered);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRSVP = async (eventId, status) => {
    try {
      await groupsService.rsvpToEvent(eventId, status);
      fetchEvents(); // Refresh to show updated RSVP counts
    } catch (error) {
      alert('Failed to update RSVP');
    }
  };
  
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await groupsService.deleteEvent(eventId);
      fetchEvents();
    } catch (error) {
      alert('Failed to delete event');
    }
  };
  
  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowCreateForm(true);
  };
  
  const handleEventCreated = () => {
    fetchEvents();
    setShowCreateForm(false);
    setEditingEvent(null);
  };
  
  if (loading) {
    return <div style={styles.loading}>Loading events...</div>;
  }
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>📅 Group Events</h3>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            style={styles.createButton}
          >
            + Create Event
          </button>
        )}
      </div>
      
      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        <button
          onClick={() => setFilter('upcoming')}
          style={{
            ...styles.filterTab,
            ...(filter === 'upcoming' ? styles.filterTabActive : {})
          }}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          style={{
            ...styles.filterTab,
            ...(filter === 'past' ? styles.filterTabActive : {})
          }}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterTab,
            ...(filter === 'all' ? styles.filterTabActive : {})
          }}
        >
          All Events
        </button>
      </div>
      
      {/* Events List */}
      {events.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No {filter} events found</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(true)}
              style={styles.createEmptyButton}
            >
              Create your first event
            </button>
          )}
        </div>
      ) : (
        <div style={styles.eventsList}>
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onRSVP={handleRSVP}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
      
      {/* Create/Edit Modal */}
      {showCreateForm && (
        <CreateEvent
          groupId={groupId}
          onClose={() => {
            setShowCreateForm(false);
            setEditingEvent(null);
          }}
          onEventCreated={handleEventCreated}
          eventToEdit={editingEvent}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#333',
  },
  createButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  filterTabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  filterTab: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
  },
  filterTabActive: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
  },
  emptyText: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '15px',
  },
  createEmptyButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
};

export default GroupEvents;