import api from './api';

const commentService = {
  /**
   * Get all comments for a tool
   * @param {number} toolId - Tool ID
   * @returns {Promise} Comments array
   */
  getComments: async (toolId) => {
    try {
      const response = await api.get(`/tool-comments/${toolId}`);
      return response.data?.comments || response.comments || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  /**
   * Get a single comment by ID
   * @param {number} commentId - Comment ID
   * @returns {Promise} Comment object
   */
  getComment: async (toolId, commentId) => {
    try {
      const response = await api.get(`/tool-comments/${toolId}/${commentId}`);
      return response.data?.comment || response.comment;
    } catch (error) {
      console.error('Error fetching comment:', error);
      throw error;
    }
  },

  /**
   * Create a new comment
   * @param {number} toolId - Tool ID
   * @param {string} commentText - Comment text
   * @param {number} userId - User ID
   * @returns {Promise} Created comment
   */
  createComment: async (toolId, commentText, userId) => {
    try {
      const response = await api.post(`/tool-comments/${toolId}`, {
        comment_text: commentText,
        user_id: userId
      });
      return response.data?.comment || response.comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  /**
   * Update a comment
   * @param {number} commentId - Comment ID
   * @param {string} commentText - Updated comment text
   * @param {number} userId - User ID
   * @returns {Promise} Updated comment
   */
  updateComment: async (commentId, commentText, userId) => {
    try {
      const response = await api.put(`/tool-comments/${commentId}`, {
        comment_text: commentText,
        user_id: userId
      });
      return response.data?.comment || response.comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {number} commentId - Comment ID
   * @param {number} userId - User ID
   * @returns {Promise} Success response
   */
  deleteComment: async (commentId, userId) => {
    try {
      // For DELETE, we need to send data in the request body
      // Since api.delete doesn't support body, we'll use POST to a delete endpoint
      // Or modify to send user_id as query param
      const response = await api.delete(`/tool-comments/${commentId}?user_id=${userId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
};

export default commentService;

