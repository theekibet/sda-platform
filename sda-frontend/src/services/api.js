import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Request interceptor - add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/admin/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ENDPOINTS ============
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

// ============ PROFILE ENDPOINTS ============
export const getProfile = () => API.get('/members/profile/me');
export const updateProfile = (data) => API.patch('/members/profile/me', data);
export const changePassword = (currentPassword, newPassword) => 
  API.post('/members/profile/change-password', { currentPassword, newPassword });

// ============ PROFILE PICTURE ENDPOINTS ============
export const uploadProfilePicture = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/members/profile/picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const removeProfilePicture = () => API.delete('/members/profile/picture');

// ============ LOCATION ENDPOINTS ============
export const updateLocation = (data) => API.post('/location/update', data);
export const findNearbyUsers = (city) => API.get(`/location/nearby?city=${city}`);
export const getLocationStats = (city) => API.get(`/location/stats?city=${city}`);

// ============ FORUM ENDPOINTS ============
export const getForumPosts = () => API.get('/forum/posts');
export const getForumPost = (postId) => API.get(`/forum/posts/${postId}`);
export const createForumPost = (data) => API.post('/forum/posts', data);
export const createForumReply = (data) => API.post('/forum/replies', data);
export const markReplyHelpful = (replyId) => API.patch(`/forum/replies/${replyId}/helpful`);

// ============ PRAYER ENDPOINTS ============
export const getPrayerRequests = (city, page = 1) => {
  const params = new URLSearchParams();
  if (city) params.append('city', city);
  params.append('page', page);
  return API.get(`/prayer/requests?${params.toString()}`);
};
export const getTrendingPrayers = () => API.get('/prayer/requests/trending');
export const getPrayerRequest = (id) => API.get(`/prayer/requests/${id}`);
export const createPrayerRequest = (data) => API.post('/prayer/requests', data);
export const prayForRequest = (id) => API.post(`/prayer/requests/${id}/pray`);

// ============ TESTIMONY ENDPOINTS ============
export const getTestimonies = (page = 1) => API.get(`/prayer/testimonies?page=${page}`);
export const createTestimony = (data) => API.post('/prayer/testimonies', data);
export const encourageTestimony = (id) => API.post(`/prayer/testimonies/${id}/encourage`);

// ============ GROUPS ENDPOINTS ============
export const getGroups = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.category) queryParams.append('category', params.category);
  if (params.location) queryParams.append('location', params.location);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/groups?${queryParams.toString()}`);
};

export const getMyGroups = (page = 1) => API.get(`/groups/my-groups?page=${page}`);
export const getGroupById = (groupId) => API.get(`/groups/${groupId}`);
export const createGroup = (data) => API.post('/groups', data);
export const updateGroup = (groupId, data) => API.put(`/groups/${groupId}`, data);
export const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);
export const joinGroup = (groupId, message = '') => API.post(`/groups/${groupId}/join`, { message });
export const leaveGroup = (groupId) => API.post(`/groups/${groupId}/leave`);
export const approveMember = (groupId, memberId) => API.post(`/groups/${groupId}/approve/${memberId}`);
export const rejectMember = (groupId, memberId) => API.post(`/groups/${groupId}/reject/${memberId}`);
export const getGroupDiscussions = (groupId, page = 1) => 
  API.get(`/groups/${groupId}/discussions?page=${page}`);
export const createDiscussion = (data) => API.post('/groups/discussions', data);

// ============ GROUP CHAT ENDPOINTS ============
export const getDiscussionWithReplies = (discussionId, page = 1, limit = 20, after = null) => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (after) params.append('after', after);
  return API.get(`/groups/discussions/${discussionId}?${params.toString()}`);
};

export const createDiscussionReply = (data) => API.post('/groups/discussions/reply', data);
export const markMessagesAsRead = (discussionId, messageIds) => 
  API.post(`/groups/discussions/${discussionId}/read`, { messageIds });
export const startTyping = (discussionId) => 
  API.post(`/groups/discussions/${discussionId}/typing/start`);
export const stopTyping = (discussionId) => 
  API.post(`/groups/discussions/${discussionId}/typing/stop`);

// ============ REPORTS ENDPOINTS ============
export const createReport = (data) => API.post('/reports', data);
export const getMyReports = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/reports/my-reports?${queryParams.toString()}`);
};
export const getReportById = (reportId) => API.get(`/reports/my-reports/${reportId}`);

// ============ ADMIN DASHBOARD ============
export const getDashboardStats = () => API.get('/admin/dashboard');

// ============ ADMIN USER MANAGEMENT ============
export const getUsers = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Only add parameters that have values
  if (params.search) queryParams.append('search', params.search);
  if (params.isAdmin !== undefined) queryParams.append('isAdmin', params.isAdmin);
  if (params.isSuspended !== undefined) queryParams.append('isSuspended', params.isSuspended);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  
  const url = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  console.log('Fetching users with URL:', url); // Debug log
  return API.get(url);
};
export const getUserDetails = (userId) => API.get(`/admin/users/${userId}`);
export const suspendUser = (userId, data) => API.post(`/admin/users/${userId}/suspend`, data);
export const toggleAdmin = (userId) => API.post(`/admin/users/${userId}/toggle-admin`);
export const adminResetPassword = (data) => API.post('/admin/users/reset-password', data);
export const deleteUser = (userId) => API.delete(`/admin/users/${userId}`);
export const bulkUserAction = (action, userIds, data) => 
  API.post('/admin/users/bulk', { action, userIds, data });

// ============ ADMIN REPORTS MANAGEMENT ============
export const getReports = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.append('status', params.status);
  if (params.priority) queryParams.append('priority', params.priority);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/reports?${queryParams.toString()}`);
};

export const getReportStats = () => API.get('/admin/reports/stats');
export const getAdminReportById = (reportId) => API.get(`/admin/reports/${reportId}`);
export const resolveReport = (reportId, data) => 
  API.post(`/admin/reports/${reportId}/resolve`, data);
export const assignReport = (reportId, assigneeId) => 
  API.post(`/admin/reports/${reportId}/assign`, { assigneeId });

// ============ ADMIN MODERATION ============
export const getContentModerationQueue = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Match the parameter names EXACTLY as in your DTO
  if (params.type) queryParams.append('type', params.type);
  if (params.status) queryParams.append('status', params.status);
  if (params.severity) queryParams.append('severity', params.severity); // Changed from 'priority' to 'severity'
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  
  const url = `/admin/moderation/queue${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return API.get(url);
};

export const getContentForReview = (contentType, contentId) => 
  API.get(`/admin/moderation/content/${contentType}/${contentId}`);
export const moderateContent = (contentId, data) => 
  API.post(`/admin/moderation/content/${contentId}`, data);
export const getModerationLogs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.moderatorId) queryParams.append('moderatorId', params.moderatorId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/moderation/logs?${queryParams.toString()}`);
};

// ============ ADMIN ANALYTICS ============
export const getAnalytics = (startDate, endDate, metrics = []) => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  if (metrics.length) params.append('metrics', metrics.join(','));
  return API.get(`/admin/analytics?${params.toString()}`);
};

export const getUserGrowth = (startDate, endDate, period = 'monthly') => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  params.append('period', period);
  return API.get(`/admin/analytics/user-growth?${params.toString()}`);
};
export const getDemographics = () => API.get('/admin/analytics/demographics');
export const getContentAnalytics = (startDate, endDate) => {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  return API.get(`/admin/analytics/content?${params.toString()}`);
};
export const getEngagementMetrics = (days = 30) => 
  API.get(`/admin/analytics/engagement?days=${days}`);

// ============ ADMIN ANNOUNCEMENTS ============
export const createAnnouncement = (data) => API.post('/admin/announcements', data);
export const getAnnouncements = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.active) queryParams.append('active', params.active);
  return API.get(`/admin/announcements?${queryParams.toString()}`);
};
export const getActiveAnnouncements = () => API.get('/announcements/active');  
export const getAnnouncementById = (id) => API.get(`/admin/announcements/${id}`);
export const updateAnnouncement = (id, data) => API.put(`/admin/announcements/${id}`, data);
export const deleteAnnouncement = (id) => API.delete(`/admin/announcements/${id}`);
export const markAnnouncementAsViewed = (id) => API.post(`/admin/announcements/${id}/view`);

// ============ ADMIN SETTINGS ============
export const getSystemSettings = () => API.get('/admin/settings');
export const updateSystemSettings = (settings) => API.put('/admin/settings', settings);
export const getFeatureFlags = () => API.get('/admin/features');
export const updateFeatureFlag = (flag, enabled) => 
  API.patch(`/admin/features/${flag}`, { enabled });
export const getEmailTemplates = () => API.get('/admin/email-templates');
export const updateEmailTemplate = (name, content) => 
  API.put(`/admin/email-templates/${name}`, content);
export const sendTestEmail = (template, testEmail) => 
  API.post('/admin/email-templates/test', { template, testEmail });

// ============ ADMIN SECURITY ============
export const getBlockedIPs = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/security/blocked-ips?${queryParams.toString()}`);
};
export const blockIP = (ipAddress, data) => API.post('/admin/security/block-ip', { ipAddress, ...data });
export const unblockIP = (ipAddress) => API.delete(`/admin/security/block-ip/${ipAddress}`);
export const getActiveSessions = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/security/sessions?${queryParams.toString()}`);
};
export const terminateSession = (sessionId) => API.delete(`/admin/security/sessions/${sessionId}`);
export const terminateAllUserSessions = (userId) => 
  API.delete(`/admin/security/sessions/user/${userId}`);
export const getLoginAttempts = (days = 7, params = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append('days', days);
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  return API.get(`/admin/security/login-attempts?${queryParams.toString()}`);
};
export const getFailedLoginAttempts = (days = 7) => 
  API.get(`/admin/security/login-attempts/failed?days=${days}`);

// ============ ADMIN MAINTENANCE ============
export const getSystemHealth = () => API.get('/admin/maintenance/health');
export const clearCache = () => API.post('/admin/maintenance/cache/clear');
export const getDatabaseStats = () => API.get('/admin/maintenance/database/stats');
export const optimizeDatabase = () => API.post('/admin/maintenance/database/optimize');
export const createDatabaseBackup = (data = {}) => API.post('/admin/maintenance/backup/create', data);
export const getBackupList = () => API.get('/admin/maintenance/backup/list');
export const downloadBackup = (backupId) => 
  API.get(`/admin/maintenance/backup/download/${backupId}`, { responseType: 'blob' });
export const restoreBackup = (backupId) => API.post(`/admin/maintenance/backup/restore/${backupId}`);
export const deleteBackup = (backupId) => API.delete(`/admin/maintenance/backup/${backupId}`);

// ============ MODERATOR ENDPOINTS ============
export const getModeratorQueue = () => API.get('/moderator/queue');
export const moderatePost = (postId, action, reason) => 
  API.post(`/moderator/posts/${postId}`, { action, reason });
export const warnUser = (userId, reason) => 
  API.post(`/moderator/users/${userId}/warn`, { reason });
export const getModeratorStats = () => API.get('/moderator/stats');

// ============ ANALYTICS EXPORT ============
export const exportAnalytics = (type, dateRange, format = 'csv') => {
  const params = new URLSearchParams();
  params.append('type', type);
  params.append('startDate', dateRange.start);
  params.append('endDate', dateRange.end);
  params.append('format', format);
  return API.get(`/admin/analytics/export?${params.toString()}`, { responseType: 'blob' });
};

export { API };