import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import promptService from '../services/promptService';
import PromptCard from './PromptCard';
import SEO from './SEO';
import '../styles/PromptsLibrary.css';

function PromptCollections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionPrompts, setCollectionPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  const [collectionForm, setCollectionForm] = useState({
    name: '',
    description: '',
    is_public: false
  });

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadCollections();
  }, [user]);

  const userId = user?.id;

  useEffect(() => {
    if (selectedCollection) {
      loadCollectionPrompts(selectedCollection.id);
    }
  }, [selectedCollection]);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await promptService.getCollections(userId);
      setCollections(data);
      if (data.length > 0 && !selectedCollection) {
        setSelectedCollection(data[0]);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
      alert('Please login to view your collections');
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionPrompts = async (collectionId) => {
    try {
      const data = await promptService.getCollectionPrompts(collectionId);
      setCollectionPrompts(data);
    } catch (error) {
      console.error('Error loading collection prompts:', error);
      setCollectionPrompts([]);
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionForm.name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      await promptService.createCollection({
        ...collectionForm,
        user_id: userId
      });
      alert('Collection created!');
      setShowAddCollection(false);
      resetForm();
      loadCollections();
    } catch (error) {
      console.error('Error creating collection:', error);
      alert('Error creating collection: ' + error.message);
    }
  };

  const handleUpdateCollection = async () => {
    if (!collectionForm.name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    try {
      await promptService.updateCollection(editingCollection, collectionForm);
      alert('Collection updated!');
      setEditingCollection(null);
      resetForm();
      loadCollections();
    } catch (error) {
      console.error('Error updating collection:', error);
      alert('Error updating collection: ' + error.message);
    }
  };

  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      await promptService.deleteCollection(collectionId);
      alert('Collection deleted!');
      if (selectedCollection?.id === collectionId) {
        setSelectedCollection(null);
        setCollectionPrompts([]);
      }
      loadCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Error deleting collection: ' + error.message);
    }
  };

  const handleRemovePrompt = async (promptId) => {
    if (!window.confirm('Remove this prompt from the collection?')) {
      return;
    }

    try {
      await promptService.removePromptFromCollection(selectedCollection.id, promptId);
      loadCollectionPrompts(selectedCollection.id);
      loadCollections(); // Reload to update prompt counts
    } catch (error) {
      console.error('Error removing prompt:', error);
      alert('Error removing prompt: ' + error.message);
    }
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection.id);
    setCollectionForm({
      name: collection.name,
      description: collection.description || '',
      is_public: collection.is_public || false
    });
  };

  const resetForm = () => {
    setCollectionForm({
      name: '',
      description: '',
      is_public: false
    });
  };

  const handleCancel = () => {
    setShowAddCollection(false);
    setEditingCollection(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="prompts-loading" style={{ minHeight: '60vh' }}>
        <div className="spinner"></div>
        <p>Loading collections...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="prompts-library">
      <SEO 
        title="My Prompt Collections - Manage Collections | Clarifyall"
        description={`Manage your saved AI prompt collections. ${collections.length > 0 ? `You have ${collections.length} collections.` : 'Create your first collection to organize prompts.'}`}
        keywords="AI prompts, saved prompts, prompt collections, organize prompts"
        dynamicKeywords={{ totalCollections: collections.length }}
        canonicalUrl="/my-collections"
        schemaType="website"
      />
      
      {/* Header */}
      <div className="prompts-header">
        <h1>📚 My Collections</h1>
        <p>Organize and manage your favorite AI prompts</p>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddCollection(true)}
          style={{ marginTop: '1rem' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
            <path d="M12 4v16m8-8H4" />
          </svg>
          New Collection
        </button>
      </div>

      {/* Add/Edit Collection Form */}
      {(showAddCollection || editingCollection) && (
        <div className="prompt-form" style={{ marginBottom: '2rem' }}>
          <h3>{editingCollection ? 'Edit Collection' : 'Create New Collection'}</h3>
          
          <div className="form-group">
            <label className="required">Collection Name</label>
            <input
              type="text"
              className="form-input"
              value={collectionForm.name}
              onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
              placeholder="e.g., My Favorite Portraits"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-input"
              value={collectionForm.description}
              onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
              placeholder="Optional description for this collection"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={collectionForm.is_public}
                onChange={(e) => setCollectionForm({ ...collectionForm, is_public: e.target.checked })}
              />
              <span>Make this collection public</span>
            </label>
            <div className="form-help">
              Public collections can be viewed by other users
            </div>
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={editingCollection ? handleUpdateCollection : handleCreateCollection}
            >
              {editingCollection ? 'Update Collection' : 'Create Collection'}
            </button>
          </div>
        </div>
      )}

      {/* Collections List */}
      {collections.length === 0 ? (
        <div className="prompts-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3>No collections yet</h3>
          <p>Create your first collection to start organizing prompts</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddCollection(true)}
            style={{ marginTop: '1rem' }}
          >
            Create Collection
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
          {/* Sidebar - Collections List */}
          <div>
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '1rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              position: 'sticky',
              top: '2rem'
            }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>
                Collections ({collections.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {collections.map(collection => (
                  <div
                    key={collection.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: selectedCollection?.id === collection.id ? '#eff6ff' : 'transparent',
                      border: selectedCollection?.id === collection.id ? '2px solid #3b82f6' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setSelectedCollection(collection)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          {collection.name}
                          {collection.is_public && (
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#10b981' }}>
                              🌐 Public
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {collection.prompt_count || 0} prompt{collection.prompt_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {selectedCollection?.id === collection.id && (
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            className="btn-icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCollection(collection);
                            }}
                            title="Edit"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className="btn-icon-sm btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(collection.id);
                            }}
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Collection Prompts */}
          <div>
            {selectedCollection ? (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <h2>{selectedCollection.name}</h2>
                  {selectedCollection.description && (
                    <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
                      {selectedCollection.description}
                    </p>
                  )}
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {collectionPrompts.length} prompt{collectionPrompts.length !== 1 ? 's' : ''}
                    </span>
                    {selectedCollection.is_public && (
                      <span style={{ 
                        fontSize: '0.875rem', 
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '6px',
                        fontWeight: '500'
                      }}>
                        🌐 Public Collection
                      </span>
                    )}
                  </div>
                </div>

                {collectionPrompts.length === 0 ? (
                  <div className="prompts-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <h3>No prompts in this collection</h3>
                    <p>Browse the prompts library and save prompts to this collection</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/prompts')}
                      style={{ marginTop: '1rem' }}
                    >
                      Browse Prompts
                    </button>
                  </div>
                ) : (
                  <div className="prompts-grid">
                    {collectionPrompts.map(prompt => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onSave={() => handleRemovePrompt(prompt.id)}
                        isSaved={true}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="prompts-empty">
                <h3>Select a collection</h3>
                <p>Choose a collection from the sidebar to view its prompts</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PromptCollections;
