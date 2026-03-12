import { useState, useCallback, useEffect } from 'react';
import { 
  getAnnouncements, 
  getActiveAnnouncements, 
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsViewed
} from '../services/api';

export const useAnnouncements = (options = {}) => {
  const { autoFetch = true, fetchActive = false } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncements, setActiveAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    limit: 20,
  });

  // Fetch all announcements (admin)
  const fetchAnnouncements = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAnnouncements({
        page: pagination.page,
        limit: pagination.limit,
        ...params
      });
      
      setAnnouncements(response.data.announcements || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 1,
      }));
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch announcements';
      setError(errorMessage);
      console.error('Error fetching announcements:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Fetch active announcements (for users)
  const fetchActiveAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getActiveAnnouncements();
      setActiveAnnouncements(response.data || []);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch active announcements';
      setError(errorMessage);
      console.error('Error fetching active announcements:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new announcement (admin)
  const createNewAnnouncement = useCallback(async (announcementData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await createAnnouncement(announcementData);
      
      // Refresh list
      await fetchAnnouncements();
      
      return { 
        success: true, 
        data: response.data,
        message: 'Announcement created successfully'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create announcement';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements]);

  // Update announcement (admin)
  const updateExistingAnnouncement = useCallback(async (id, announcementData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await updateAnnouncement(id, announcementData);
      
      // Refresh list
      await fetchAnnouncements();
      
      return { 
        success: true, 
        data: response.data,
        message: 'Announcement updated successfully'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update announcement';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements]);

  // Delete announcement (admin)
  const deleteExistingAnnouncement = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteAnnouncement(id);
      
      // Refresh list
      await fetchAnnouncements();
      
      return { 
        success: true, 
        message: 'Announcement deleted successfully'
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete announcement';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements]);

  // Mark announcement as viewed (user)
  const markAsViewed = useCallback(async (announcementId) => {
    try {
      await markAnnouncementAsViewed(announcementId);
      
      // Update local state
      setActiveAnnouncements(prev => 
        prev.map(a => 
          a.id === announcementId ? { ...a, viewed: true } : a
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error marking announcement as viewed:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Select announcement for editing
  const selectAnnouncement = useCallback((announcement) => {
    setSelectedAnnouncement(announcement);
  }, []);

  // Clear selected announcement
  const clearSelectedAnnouncement = useCallback(() => {
    setSelectedAnnouncement(null);
  }, []);

  // Change page
  const setPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      if (fetchActive) {
        fetchActiveAnnouncements();
      } else {
        fetchAnnouncements();
      }
    }
  }, [autoFetch, fetchActive, fetchAnnouncements, fetchActiveAnnouncements]);

  return {
    loading,
    error,
    announcements,
    activeAnnouncements,
    selectedAnnouncement,
    pagination,
    fetchAnnouncements,
    fetchActiveAnnouncements,
    createNewAnnouncement,
    updateExistingAnnouncement,
    deleteExistingAnnouncement,
    markAsViewed,
    selectAnnouncement,
    clearSelectedAnnouncement,
    setPage,
  };
};