import api from './api';

const dbService = {
  // Tools methods
  async getTools(filters = {}) {
    const params = new URLSearchParams();
    if (filters.searchTerm) params.append('search', filters.searchTerm);
    if (filters.categoryId) params.append('category_id', filters.categoryId);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.page !== undefined) params.append('page', filters.page);
    if (filters.size !== undefined) params.append('size', filters.size);
    
    const response = await api.get(`/tools.php?${params.toString()}`);
    // Return response with pagination info
    return {
      tools: response.data.tools || response.data || [],
      totalElements: response.data.totalElements || 0,
      totalPages: response.data.totalPages || 0,
      currentPage: response.data.currentPage || 0,
      size: response.data.size || 12
    };
  },

  async getToolById(id) {
    const response = await api.get(`/tools.php/${id}`);
    return response.data;
  },

  async createTool(toolData) {
    const response = await api.post('/tools.php', toolData);
    return response.data.id;
  },

  async incrementViewCount(id) {
    // View count is automatically incremented when getting tool by ID
    return true;
  },

  // Categories methods
  async getCategories() {
    const response = await api.get('/categories.php');
    return response.data;
  },

  async getCategoryById(id) {
    const categories = await this.getCategories();
    return categories.find(cat => cat.id === parseInt(id));
  },

  // Users methods
  async createUser(userData) {
    const response = await api.post('/users.php', {
      action: 'register',
      ...userData
    });
    return response.data;
  },

  async getUserByEmail(email, password) {
    const response = await api.post('/users.php', {
      action: 'login',
      email,
      password
    });
    return response.data;
  },

  async getUserById(id) {
    // Fetch fresh user data from API to ensure is_verified status is current
    try {
      const response = await api.get(`/users.php?id=${id}`);
      if (response.data?.success && response.data?.user) {
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      } else if (response.data?.id) {
        // If response.data is the user object directly
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      // Fallback to localStorage if API fails
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error fetching user from API:', error);
      // Fallback to localStorage if API fails
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
  },

  async updateUser(id, userData) {
    // Update localStorage for now
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const updatedUser = { ...user, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },

  // User saved tools methods
  async getUserSavedTools(userId) {
    const response = await api.get(`/users.php?action=saved_tools&user_id=${userId}`);
    return response.data.tools || [];
  },

  async saveTool(userId, toolId) {
    await api.post('/users.php', {
      action: 'save_tool',
      user_id: userId,
      tool_id: toolId
    });
  },

  async unsaveTool(userId, toolId) {
    await api.post('/users.php', {
      action: 'unsave_tool',
      user_id: userId,
      tool_id: toolId
    });
  },

  async isToolSaved(userId, toolId) {
    const savedTools = await this.getUserSavedTools(userId);
    return savedTools.some(tool => tool.id === parseInt(toolId));
  },

  // Logo upload method
  async uploadLogo(logoFile) {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await api.postFormData('/tools.php?action=upload_logo', formData);
    return response.data;
  }
};

export default dbService;
