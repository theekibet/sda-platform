// src/services/notificationService.js
import { API } from './api';  // Use named import, not default

export const notificationService = {
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    if (params.type) queryParams.append('type', params.type);
    
    const response = await API.get(`/notifications?${queryParams}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await API.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await API.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await API.post('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await API.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  archiveNotification: async (notificationId) => {
    const response = await API.patch(`/notifications/${notificationId}/archive`);
    return response.data;
  },
};