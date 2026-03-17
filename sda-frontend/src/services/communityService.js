// src/services/communityService.js
import { API } from './api';

export const communityService = {
  // Get all posts with optional filters (including radius-based local)
  getPosts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.local) params.append('local', filters.local); // 'true' for local only
    if (filters.radius) params.append('radius', filters.radius); // NEW: radius in km
    
    const response = await API.get(`/community/posts?${params}`);
    return response.data;
  },

  // Get local posts within radius (UPDATED with radius parameter)
  getLocalPosts: async (radius = 10, limit = 10) => {
    const params = new URLSearchParams();
    params.append('radius', radius);
    params.append('limit', limit);
    const response = await API.get(`/community/posts/local?${params}`);
    return response.data;
  },

  // Get a single post
  getPost: async (postId) => {
    const response = await API.get(`/community/posts/${postId}`);
    return response.data;
  },

  // Create a new post
  createPost: async (postData) => {
    const response = await API.post('/community/posts', postData);
    return response.data;
  },

  // Update a post
  updatePost: async (postId, postData) => {
    const response = await API.put(`/community/posts/${postId}`, postData);
    return response.data;
  },

  // Delete a post
  deletePost: async (postId) => {
    const response = await API.delete(`/community/posts/${postId}`);
    return response.data;
  },

  // Add response to a post
  addResponse: async (postId, responseData) => {
    const response = await API.post(`/community/posts/${postId}/responses`, responseData);
    return response.data;
  },

  // Remove response from a post
  removeResponse: async (postId) => {
    const response = await API.delete(`/community/posts/${postId}/responses`);
    return response.data;
  },

  // Get posts by user
  getUserPosts: async (userId, page = 1) => {
    const response = await API.get(`/community/users/${userId}/posts?page=${page}`);
    return response.data;
  }
};