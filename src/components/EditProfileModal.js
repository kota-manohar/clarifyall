import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import '../styles/EditProfileModal.css';

function EditProfileModal({ isOpen, onClose, user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: null
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        avatar: null
      });
      setPreview(user.avatar_url || user.avatarUrl || null);
      setError('');
      setSuccess('');
    }
  }, [isOpen, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setFormData({ ...formData, avatar: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate name
      if (!formData.name || formData.name.trim() === '') {
        setError('Name is required');
        setLoading(false);
        return;
      }

      const updates = {
        name: formData.name.trim(),
        bio: formData.bio ? formData.bio.trim() : null
      };

      // Upload avatar first if selected (so we get the avatar URL)
      if (formData.avatar) {
        try {
          const avatarResult = await userService.uploadAvatar(formData.avatar);
          if (avatarResult.avatarUrl) {
            updates.avatar_url = avatarResult.avatarUrl;
          }
          if (avatarResult.user) {
            // If avatar upload returned user data, use it
            updates.avatar_url = avatarResult.user.avatar_url || avatarResult.avatarUrl;
          }
        } catch (avatarError) {
          console.error('Avatar upload error:', avatarError);
          // Continue with profile update even if avatar fails
        }
      }

      // Update profile
      const profileResult = await userService.updateProfile(updates);

      setSuccess(profileResult.message || 'Profile updated successfully!');
      
      // Notify parent component with updated user
      if (onUpdate) {
        const updatedUser = profileResult.user || {
          ...user,
          name: updates.name,
          bio: updates.bio,
          avatar_url: updates.avatar_url || user.avatar_url || user.avatarUrl
        };
        onUpdate(updatedUser);
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edit-profile-modal-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="success-message">
              <p>{success}</p>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="form-group">
            <label>Profile Picture</label>
            <div className="avatar-upload-section">
              <div className="avatar-preview">
                {preview ? (
                  <img src={preview} alt="Avatar preview" />
                ) : (
                  <span>{formData.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="avatar-upload-controls">
                <input
                  type="file"
                  accept="image/*"
                  id="avatar-upload"
                  onChange={handleAvatarChange}
                  className="file-input"
                />
                <label htmlFor="avatar-upload" className="btn-upload-avatar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  Upload Photo
                </label>
                {preview && (
                  <button
                    type="button"
                    className="btn-remove-avatar"
                    onClick={() => {
                      setPreview(null);
                      setFormData({ ...formData, avatar: null });
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="form-help">
              JPG, PNG or GIF. Max size 5MB
            </div>
          </div>

          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="required">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Tell us about yourself..."
              maxLength={500}
            />
            <div className="form-help">
              {formData.bio.length}/500 characters
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfileModal;

