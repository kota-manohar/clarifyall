import api from './api';

const userActivityService = {
  // Get recently viewed tools
  async getRecentlyViewed(userId, limit = 10) {
    const response = await api.get(`/user-activity.php/recently-viewed?user_id=${userId}&limit=${limit}`);
    return response.data;
  },

  // Get user stats
  async getUserStats(userId) {
    const response = await api.get(`/user-activity.php/stats?user_id=${userId}`);
    return response.data;
  },

  // Get recommended tools
  async getRecommendedTools(userId, limit = 6) {
    const response = await api.get(`/user-activity.php/recommended?user_id=${userId}&limit=${limit}`);
    return response.data;
  },

  // Get user activity
  async getUserActivity(userId, limit = 20, days = 30) {
    const response = await api.get(`/user-activity.php/activity?user_id=${userId}&limit=${limit}&days=${days}`);
    return response.data;
  },

  // Track tool view
  async trackToolView(userId, toolId, duration = 0) {
    const response = await api.post('/user-activity.php/track-view', {
      user_id: userId,
      tool_id: toolId,
      duration: duration
    });
    return response.data;
  },

  // Track activity
  async trackActivity(userId, toolId, activityType, activityData = null) {
    const response = await api.post('/user-activity.php/track-activity', {
      user_id: userId,
      tool_id: toolId,
      activity_type: activityType,
      activity_data: activityData
    });
    return response.data;
  }
};

export default userActivityService;

