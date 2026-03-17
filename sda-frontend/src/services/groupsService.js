// src/services/groupsService.js
import { API } from './api';

export const groupsService = {
  // ============ GROUP CRUD ============
  getGroups: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.location) queryParams.append('location', params.location);
    if (params.search) queryParams.append('search', params.search);
    if (params.meetingType) queryParams.append('meetingType', params.meetingType);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await API.get(`/groups?${queryParams}`);
    return response.data;
  },

  getMyGroups: async (page = 1) => {
    const response = await API.get(`/groups/my-groups?page=${page}`);
    return response.data;
  },

  getGroupById: async (groupId) => {
    const response = await API.get(`/groups/${groupId}`);
    return response.data;
  },

  createGroup: async (data) => {
    const response = await API.post('/groups', data);
    return response.data;
  },

  updateGroup: async (groupId, data) => {
    const response = await API.put(`/groups/${groupId}`, data);
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await API.delete(`/groups/${groupId}`);
    return response.data;
  },

  // ============ GROUP MEMBERSHIP ============
  joinGroup: async (groupId, message = '') => {
    const response = await API.post(`/groups/${groupId}/join`, { message });
    return response.data;
  },

  leaveGroup: async (groupId) => {
    const response = await API.post(`/groups/${groupId}/leave`);
    return response.data;
  },

  approveMember: async (groupId, memberId) => {
    const response = await API.post(`/groups/${groupId}/approve/${memberId}`);
    return response.data;
  },

  rejectMember: async (groupId, memberId) => {
    const response = await API.post(`/groups/${groupId}/reject/${memberId}`);
    return response.data;
  },

  // ============ MESSAGES ============
  getMessages: async (groupId, page = 1, limit = 50) => {
    const response = await API.get(`/groups/${groupId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendMessage: async (groupId, data) => {
    const response = await API.post(`/groups/${groupId}/messages`, data);
    return response.data;
  },

  updateMessage: async (messageId, content) => {
    const response = await API.put(`/groups/messages/${messageId}`, { content });
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await API.delete(`/groups/messages/${messageId}`);
    return response.data;
  },

  // ============ REACTIONS ============
  addReaction: async (messageId, reaction) => {
    const response = await API.post('/groups/messages/react', { messageId, reaction });
    return response.data;
  },

  removeReaction: async (messageId, reaction) => {
    const response = await API.delete(`/groups/messages/${messageId}/reactions/${reaction}`);
    return response.data;
  },

  // ============ PINNED MESSAGES ============
  pinMessage: async (messageId) => {
    const response = await API.post(`/groups/messages/${messageId}/pin`);
    return response.data;
  },

  unpinMessage: async (messageId) => {
    const response = await API.post(`/groups/messages/${messageId}/unpin`);
    return response.data;
  },

  getPinnedMessages: async (groupId) => {
    const response = await API.get(`/groups/${groupId}/pinned`);
    return response.data;
  },

  // ============ READ RECEIPTS ============
  markAsRead: async (groupId) => {
    const response = await API.post(`/groups/${groupId}/read`);
    return response.data;
  },

  // ============ DISCOVERY ============
  getTrendingDiscussions: async () => {
    const response = await API.get('/groups/discover/trending');
    return response.data;
  },

  getMyGroupsWithStats: async () => {
    const response = await API.get('/groups/discover/my-groups');
    return response.data;
  },

  getDiscoverGroups: async () => {
    const response = await API.get('/groups/discover/suggestions');
    return response.data;
  },

  // ============ EVENTS ============
  
  // Get all events (upcoming events across all groups)
  getUpcomingEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.radius) queryParams.append('radius', params.radius);
    
    const response = await API.get(`/groups/events/upcoming?${queryParams}`);
    return response.data;
  },

  // NEW: Get events for a specific group
  getGroupEvents: async (groupId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const response = await API.get(`/groups/${groupId}/events?${queryParams}`);
    return response.data;
  },

  // NEW: Create an event in a group
  createEvent: async (groupId, data) => {
    const response = await API.post(`/groups/${groupId}/events`, data);
    return response.data;
  },

  // NEW: Update an event
  updateEvent: async (eventId, data) => {
    const response = await API.put(`/groups/events/${eventId}`, data);
    return response.data;
  },

  // NEW: Delete an event
  deleteEvent: async (eventId) => {
    const response = await API.delete(`/groups/events/${eventId}`);
    return response.data;
  },

  // NEW: RSVP to an event
  rsvpToEvent: async (eventId, status) => {
    const response = await API.post(`/groups/events/${eventId}/rsvp`, { status });
    return response.data;
  },

  // NEW: Get event attendees
  getEventAttendees: async (eventId) => {
    const response = await API.get(`/groups/events/${eventId}/attendees`);
    return response.data;
  },

  // NEW: Get a single event by ID
  getEventById: async (eventId) => {
    const response = await API.get(`/groups/events/${eventId}`);
    return response.data;
  },
};