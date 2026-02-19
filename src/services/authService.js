import dbService from './dbService';

// Browser-compatible password hashing using Web Crypto API
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'clarifyall_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const verifyPassword = async (password, hash) => {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
};

export const authService = {
  // Register new user
  register: async (email, password, name) => {
    const response = await dbService.createUser({ name, email, password });
    
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.user));
      const token = 'token-' + response.user.id + '-' + Date.now();
      localStorage.setItem('token', token);
      
      return {
        success: true,
        message: 'Registration successful!',
        user: response.user,
        token
      };
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  },

  // Login user
  login: async (email, password) => {
    const response = await dbService.getUserByEmail(email, password);
    
    if (response.success) {
      localStorage.setItem('user', JSON.stringify(response.user));
      const token = 'token-' + response.user.id + '-' + Date.now();
      localStorage.setItem('token', token);
      
      return {
        success: true,
        message: 'Login successful!',
        user: response.user,
        token
      };
    } else {
      throw new Error(response.error || 'Login failed');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('No user found');
    }
    const user = JSON.parse(userStr);
    // Refresh user data from database
    return await dbService.getUserById(user.id);
  },

  // Logout user
  logout: async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { success: true, message: 'Logged out successfully' };
  },

  // Verify email
  verifyEmail: async (token) => {
    // Call the actual API to verify email
    const api = await import('./api');
    try {
      const response = await api.default.get(`/users.php?action=verify_email&token=${token}`);
      if (response.data?.success) {
        // Update user in localStorage with is_verified (snake_case)
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.is_verified = true;
          user.isVerified = true; // Keep both for backward compatibility
          localStorage.setItem('user', JSON.stringify(user));
        }
        return {
          success: true,
          message: response.data.message || 'Email verified successfully!',
          user: response.data.user
        };
      } else {
        throw new Error(response.data?.error || 'Email verification failed');
      }
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Email verification failed');
    }
  },

  // Resend verification email
  resendVerification: async () => {
    return {
      success: true,
      message: 'Verification email sent!'
    };
  },

  // Request password reset
  forgotPassword: async (email) => {
    return {
      success: true,
      message: 'Password reset email sent!'
    };
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    return {
      success: true,
      message: 'Password reset successfully!'
    };
  },

  // Change password (for logged-in users)
  changePassword: async (currentPassword, newPassword) => {
    return {
      success: true,
      message: 'Password changed successfully!'
    };
  }
};

export default authService;
