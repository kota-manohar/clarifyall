import api from './api';

const promptService = {
  // Get all prompts (public, approved only)
  async getPrompts(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.category_id) params.append('category_id', filters.category_id);
    if (filters.tool_id) params.append('tool_id', filters.tool_id);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.order) params.append('order', filters.order);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/allprompts.php?${queryString}` : '/allprompts.php';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get all prompts (admin - includes all statuses)
  async getAllPrompts(status = null) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const url = queryString ? `/prompts.php/all?${queryString}` : '/prompts.php/all';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get prompt by ID
  async getPromptById(id) {
    const response = await api.get(`/prompts.php/${id}`);
    return response.data;
  },

  // Get prompt by slug
  async getPromptBySlug(slug) {
    const response = await api.get(`/prompts.php/slug/${slug}`);
    return response.data;
  },

  // Get trending prompts
  async getTrendingPrompts() {
    const response = await api.get('/prompts.php/trending');
    return response.data;
  },

  // Get popular prompts
  async getPopularPrompts() {
    const response = await api.get('/prompts.php/popular');
    return response.data;
  },

  // Get statistics
  async getStatistics() {
    const response = await api.get('/prompts.php/statistics');
    return response.data;
  },

  // Create new prompt
  async createPrompt(promptData) {
    const response = await api.post('/prompts.php', promptData);
    return response.data;
  },

  // Update prompt
  async updatePrompt(id, promptData) {
    const response = await api.put(`/prompts.php/${id}`, promptData);
    return response.data;
  },

  // Approve prompt (admin)
  async approvePrompt(id) {
    const response = await api.put(`/prompts.php/${id}/approve`, {});
    return response.data;
  },

  // Reject prompt (admin)
  async rejectPrompt(id) {
    const response = await api.put(`/prompts.php/${id}/reject`, {});
    return response.data;
  },

  // Delete prompt
  async deletePrompt(id) {
    const response = await api.delete(`/prompts.php/${id}`);
    return response.data;
  },

  // Upvote prompt
  async upvotePrompt(id, userId) {
    const response = await api.put(`/prompts.php/${id}/upvote`, { user_id: userId });
    return response.data;
  },

  // Downvote prompt
  async downvotePrompt(id, userId) {
    const response = await api.put(`/prompts.php/${id}/downvote`, { user_id: userId });
    return response.data;
  },

  // Get prompt categories
  async getCategories() {
    const response = await api.get('/prompt-categories.php');
    return response.data;
  },

  // Get category by ID
  async getCategoryById(id) {
    const response = await api.get(`/prompt-categories.php/${id}`);
    return response.data;
  },

  // Create category (admin)
  async createCategory(categoryData) {
    const response = await api.post('/prompt-categories.php', categoryData);
    return response.data;
  },

  // Update category (admin)
  async updateCategory(id, categoryData) {
    const response = await api.put(`/prompt-categories.php/${id}`, categoryData);
    return response.data;
  },

  // Delete category (admin)
  async deleteCategory(id) {
    const response = await api.delete(`/prompt-categories.php/${id}`);
    return response.data;
  },

  // Get user collections
  async getCollections(userId = null, isPublic = null) {
    const params = new URLSearchParams();
    if (userId) params.append('user_id', userId);
    if (isPublic !== null) params.append('is_public', isPublic);
    
    const queryString = params.toString();
    const url = queryString ? `/prompt-collections.php?${queryString}` : '/prompt-collections.php';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get collection by ID
  async getCollectionById(id) {
    const response = await api.get(`/prompt-collections.php/${id}`);
    return response.data;
  },

  // Get prompts in collection
  async getCollectionPrompts(collectionId) {
    const response = await api.get(`/prompt-collections.php/${collectionId}/prompts`);
    return response.data;
  },

  // Create collection
  async createCollection(collectionData) {
    const response = await api.post('/prompt-collections.php', collectionData);
    return response.data;
  },

  // Update collection
  async updateCollection(id, collectionData) {
    const response = await api.put(`/prompt-collections.php/${id}`, collectionData);
    return response.data;
  },

  // Delete collection
  async deleteCollection(id) {
    const response = await api.delete(`/prompt-collections.php/${id}`);
    return response.data;
  },

  // Add prompt to collection
  async addPromptToCollection(collectionId, promptId) {
    const response = await api.post(`/prompt-collections.php/${collectionId}/add-prompt`, {
      prompt_id: promptId
    });
    return response.data;
  },

  // Remove prompt from collection
  async removePromptFromCollection(collectionId, promptId) {
    const response = await api.post(`/prompt-collections.php/${collectionId}/remove-prompt`, {
      prompt_id: promptId
    });
    return response.data;
  }
};

export default promptService;
