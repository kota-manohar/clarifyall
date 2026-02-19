import api from './api';

const blogService = {
  // Get all articles
  async getArticles(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.featured !== undefined) params.append('featured', filters.featured ? 1 : 0);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/blog-articles.php?${queryString}` : '/blog-articles.php';
    
    const response = await api.get(url);
    return response.data;
  },

  // Get article by ID
  async getArticleById(id) {
    const response = await api.get(`/blog-articles.php/${id}`);
    return response.data;
  },

  // Get article by slug
  async getArticleBySlug(slug) {
    const response = await api.get(`/blog-articles.php/${slug}`);
    return response.data;
  },

  // Get featured articles
  async getFeaturedArticles(limit = 5) {
    const response = await api.get(`/blog-articles.php?featured=1&status=PUBLISHED&limit=${limit}`);
    return response.data;
  },

  // Get articles by category
  async getArticlesByCategory(category, limit = 10) {
    const response = await api.get(`/blog-articles.php?category=${category}&status=PUBLISHED&limit=${limit}`);
    return response.data;
  },

  // Create article (admin)
  async createArticle(articleData) {
    const response = await api.post('/blog-articles.php', articleData);
    return response.data;
  },

  // Update article (admin)
  async updateArticle(id, articleData) {
    const response = await api.put(`/blog-articles.php/${id}`, articleData);
    return response.data;
  },

  // Delete article (admin)
  async deleteArticle(id) {
    const response = await api.delete(`/blog-articles.php/${id}`);
    return response.data;
  }
};

export default blogService;

