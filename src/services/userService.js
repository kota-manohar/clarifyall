import api from './api';

export const userService = {
  // Get user profile by ID
  async getUserProfile(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Try direct id parameter first (simpler)
      try {
        const response = await api.get(`/users.php?id=${userId}`);
        
        // Check if we got a user object
        if (response.data && response.data.user) {
          return response.data;
        }
        
        // If response.data is the user object directly
        if (response.data && response.data.id) {
          return { user: response.data };
        }
        
        // If response.data is an object with success: false
        if (response.data && response.data.success === false) {
          throw new Error(response.data.error || 'User not found');
        }
        
        throw new Error('User not found');
      } catch (error) {
        // If direct id fails, try action-based endpoint as fallback
        if (error.message.includes('400') || error.message.includes('404') || error.message.includes('Invalid') || error.message.includes('Empty')) {
          try {
            const fallbackResponse = await api.get(`/users.php?action=profile&user_id=${userId}`);
            if (fallbackResponse.data && fallbackResponse.data.user) {
              return fallbackResponse.data;
            }
            if (fallbackResponse.data && fallbackResponse.data.id) {
              return { user: fallbackResponse.data };
            }
            if (fallbackResponse.data && fallbackResponse.data.success === false) {
              throw new Error(fallbackResponse.data.error || 'User not found');
            }
          } catch (fallbackError) {
            console.error('Both endpoints failed:', fallbackError);
            throw error; // Throw original error
          }
        }
        throw error;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      
      const user = JSON.parse(userStr);
      
      // Try PUT request first
      try {
        const response = await api.put(`/users.php/${user.id}`, updates);
        
        // Update local storage
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          return {
            success: true,
            message: response.data.message || 'Profile updated successfully!',
            user: response.data.user
          };
        }
      } catch (putError) {
        // If PUT fails, try POST with action
        console.warn('PUT request failed, trying POST:', putError);
        const response = await api.post('/users.php', {
          action: 'update_profile',
          user_id: user.id,
          ...updates
        });
        
        if (response.data && response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          return {
            success: true,
            message: response.data.message || 'Profile updated successfully!',
            user: response.data.user
          };
        }
        
        throw putError; // Re-throw if POST also fails
      }
      
      // Fallback: update local storage with provided updates
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return {
        success: true,
        message: 'Profile updated successfully!',
        user: updatedUser
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Upload avatar
  async uploadAvatar(file) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      
      const user = JSON.parse(userStr);
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Use POST for avatar upload (FormData with file uploads)
      const response = await api.post(`/users.php/${user.id}/avatar`, formData, true);
      
      // Update local storage
      if (response.data && (response.data.avatarUrl || response.data.user)) {
        const avatarUrl = response.data.avatarUrl || response.data.user?.avatar_url;
        const updatedUser = { 
          ...user, 
          avatar_url: avatarUrl,
          ...(response.data.user || {})
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return {
          success: true,
          message: response.data.message || 'Avatar uploaded successfully!',
          avatarUrl: avatarUrl,
          user: response.data.user || updatedUser
        };
      }
      
      throw new Error('Failed to upload avatar');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  // Get user's submitted tools
  async getUserTools(userId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/tools.php?submitted_by=${userId}&page=${page}&limit=${limit}`);
      return {
        tools: response.data.tools || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: page - 1
      };
    } catch (error) {
      console.error('Error fetching user tools:', error);
      return { tools: [], totalElements: 0, totalPages: 0, currentPage: 0 };
    }
  },

  // Save/bookmark a tool
  async saveTool(toolId) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      
      const user = JSON.parse(userStr);
      const response = await api.post('/users.php/save-tool', {
        user_id: user.id,
        tool_id: toolId
      });
      
      return {
        success: true,
        message: response.data.message || 'Tool saved successfully!'
      };
    } catch (error) {
      console.error('Error saving tool:', error);
      throw error;
    }
  },

  // Unsave/unbookmark a tool
  async unsaveTool(toolId) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      
      const user = JSON.parse(userStr);
      const response = await api.post('/users.php/unsave-tool', {
        user_id: user.id,
        tool_id: toolId
      });
      
      return {
        success: true,
        message: response.data.message || 'Tool removed from saved!'
      };
    } catch (error) {
      console.error('Error unsaving tool:', error);
      throw error;
    }
  },

  // Get user's saved tools
  async getSavedTools(page = 1, limit = 20) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return { tools: [], totalElements: 0, totalPages: 0, currentPage: 0 };
      
      const user = JSON.parse(userStr);
      const response = await api.get(`/users.php?saved_tools=1&user_id=${user.id}&page=${page}&limit=${limit}`);
      
      return {
        tools: response.data.tools || [],
        totalElements: response.data.totalElements || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: page - 1
      };
    } catch (error) {
      console.error('Error fetching saved tools:', error);
      return { tools: [], totalElements: 0, totalPages: 0, currentPage: 0 };
    }
  },

  // Check if user has saved a tool
  async checkSavedTool(toolId) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return { isSaved: false };
      
      const user = JSON.parse(userStr);
      const response = await api.get(`/users.php?check_saved=1&user_id=${user.id}&tool_id=${toolId}`);
      
      return { isSaved: response.data.isSaved || false };
    } catch (error) {
      console.error('Error checking saved tool:', error);
      return { isSaved: false };
    }
  },

  // Delete user account
  async deleteAccount(password) {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) throw new Error('User not logged in');
      
      const user = JSON.parse(userStr);
      await api.delete(`/users.php/${user.id}`, { password });
      
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      return {
        success: true,
        message: 'Account deleted successfully!'
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
};

export default userService;
