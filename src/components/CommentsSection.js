import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import commentService from '../services/commentService';
import '../styles/CommentsSection.css';

function CommentsSection({ toolId }) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (toolId) {
      loadComments();
    }
  }, [toolId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const commentsData = await commentService.getComments(toolId);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
      const newComment = await commentService.createComment(toolId, commentText.trim(), userId);
      setComments([newComment, ...comments]);
      setCommentText('');
      alert('Comment submitted successfully!');
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
      const updatedComment = await commentService.updateComment(commentId, editText.trim(), userId);
      setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      setEditingId(null);
      setEditText('');
      alert('Comment updated successfully!');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;
      await commentService.deleteComment(commentId, userId);
      setComments(comments.filter(c => c.id !== commentId));
      alert('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const currentUserId = user?.id || JSON.parse(localStorage.getItem('user'))?.id;

  return (
    <div className="comments-section">
      <h2 className="comments-title">Comments ({comments.length})</h2>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-form-header">
            <div className="comment-user-avatar">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} />
              ) : (
                <span>{getInitials(user?.name || 'User')}</span>
              )}
            </div>
            <div className="comment-form-content">
              <textarea
                className="comment-textarea"
                placeholder="Share your thoughts about this tool..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows="4"
                required
              />
              <div className="comment-form-actions">
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={submitting || !commentText.trim()}
                >
                  {submitting ? 'Submitting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-login-prompt">
          <p>Please <button onClick={() => navigate('/login')} className="login-link-btn">login</button> to post a comment.</p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="comments-loading">
          <p>Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar">
                {comment.user_avatar ? (
                  <img src={comment.user_avatar} alt={comment.user_name} />
                ) : (
                  <span>{getInitials(comment.user_name)}</span>
                )}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <div className="comment-author">
                    <span className="comment-author-name">{comment.user_name || 'Anonymous'}</span>
                    <span className="comment-date">{formatDate(comment.created_at)}</span>
                  </div>
                  {currentUserId && comment.user_id === currentUserId && (
                    <div className="comment-actions">
                      {editingId === comment.id ? (
                        <>
                          <button
                            className="comment-action-btn comment-save-btn"
                            onClick={() => handleUpdate(comment.id)}
                          >
                            Save
                          </button>
                          <button
                            className="comment-action-btn comment-cancel-btn"
                            onClick={() => {
                              setEditingId(null);
                              setEditText('');
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="comment-action-btn comment-edit-btn"
                            onClick={() => handleEdit(comment)}
                          >
                            Edit
                          </button>
                          <button
                            className="comment-action-btn comment-delete-btn"
                            onClick={() => handleDelete(comment.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {editingId === comment.id ? (
                  <textarea
                    className="comment-edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows="3"
                  />
                ) : (
                  <p className="comment-text">{comment.comment_text}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;

