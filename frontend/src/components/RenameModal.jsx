import { useState } from 'react';
import api from '../api/axios';
import './RenameModal.css';

export default function RenameModal({ item, itemType, onClose, onRenameSuccess }) {
  const [newName, setNewName] = useState(item.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRename = async (e) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (newName === item.name) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = itemType === 'file' ? `/files/${item.id}` : `/folders/${item.id}`;
      await api.patch(endpoint, { name: newName });
      onRenameSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rename ' + itemType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rename-modal-overlay" onClick={onClose}>
      <div className="rename-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Rename {itemType}</h2>
        
        <form onSubmit={handleRename}>
          <div className="form-group">
            <label>Current name:</label>
            <input
              type="text"
              value={item.name}
              disabled
              className="current-name"
            />
          </div>

          <div className="form-group">
            <label>New name:</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              autoFocus
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rename-btn"
              disabled={loading}
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
