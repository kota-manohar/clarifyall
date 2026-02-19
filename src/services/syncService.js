import dbService from './dbService';

class SyncService {
  constructor() {
    this.syncUrl = 'https://api.jsonbin.io/v3/b'; // Free JSON storage service
    this.apiKey = '$2a$10$your-api-key'; // You can get free API key from jsonbin.io
  }

  // Export all data to shareable format
  async exportData() {
    const categories = await dbService.getCategories();
    const tools = await dbService.getTools();
    const users = await dbService.users.toArray();
    const savedTools = await dbService.user_saved_tools.toArray();

    return {
      categories,
      tools,
      users: users.map(u => ({ ...u, password_hash: undefined })), // Remove passwords
      savedTools,
      exportedAt: new Date().toISOString()
    };
  }

  // Import data from another system
  async importData(data) {
    if (data.categories) await dbService.categories.bulkPut(data.categories);
    if (data.tools) await dbService.tools.bulkPut(data.tools);
    if (data.savedTools) await dbService.user_saved_tools.bulkPut(data.savedTools);
  }

  // Sync to cloud (optional)
  async syncToCloud() {
    try {
      const data = await this.exportData();
      const response = await fetch(this.syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.apiKey
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const result = await response.json();
        localStorage.setItem('sync_id', result.metadata.id);
        return result.metadata.id;
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  // Load from cloud
  async syncFromCloud(syncId) {
    try {
      const response = await fetch(`${this.syncUrl}/${syncId}/latest`, {
        headers: { 'X-Master-Key': this.apiKey }
      });
      
      if (response.ok) {
        const result = await response.json();
        await this.importData(result.record);
        return true;
      }
    } catch (error) {
      console.error('Load failed:', error);
    }
    return false;
  }
}

export const syncService = new SyncService();

// Add sync buttons to your UI
export const SyncButtons = () => {
  const handleExport = async () => {
    const data = await syncService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarifyall-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await syncService.importData(data);
          window.location.reload(); // Refresh to show new data
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ padding: '10px', borderTop: '1px solid #eee' }}>
      <h4>Data Sync</h4>
      <button onClick={handleExport} style={{ marginRight: '10px' }}>
        📤 Export Data
      </button>
      <label style={{ cursor: 'pointer' }}>
        📥 Import Data
        <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
      </label>
    </div>
  );
};

export default syncService;