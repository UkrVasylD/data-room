import { useState, useEffect } from 'react';
import api from '../api/axios';
import './MoveModal.css';

export default function MoveModal({ file, dataRoomId, currentFolderId, onClose, onMoveSuccess }) {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      // Load dataRoom to get root-level folders
      const res = await api.get(`/data-rooms/${dataRoomId}`);
      const rootFolders = res.data.folders || [];
      
      // Add "Root" as an option (null folderId)
      setFolders([
        { id: null, name: '📁 Root', level: 0 },
        ...flattenFolders(rootFolders, 0)
      ]);
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Failed to load folders');
    }
  };

  const flattenFolders = (folderList, level) => {
    return folderList.flatMap(folder => [
      { id: folder.id, name: '📁 ' + '  '.repeat(level) + folder.name, level },
      ...flattenFolders(folder.children || [], level + 1)
    ]);
  };

  const handleMove = async (e) => {
    e.preventDefault();

    if (selectedFolderId === currentFolderId) {
      setError('File is already in this folder');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // selectedFolderId can be null (Root) or a folder id
      await api.patch(`/files/${file.id}/move`, { folderId: selectedFolderId || null });
      onMoveSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to move file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="move-modal-overlay" onClick={onClose}>
      <div className="move-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Move File</h2>
        
        <form onSubmit={handleMove}>
          <div className="form-group">
            <label>Select destination folder:</label>
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value === '' ? null : e.target.value)}
              required
            >
              <option value="">-- Choose a folder --</option>
              {folders.map(folder => (
                <option key={folder.id || 'root'} value={folder.id || ''}>
                  {folder.name}
                </option>
              ))}
            </select>
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
              className="move-btn"
              disabled={loading || selectedFolderId === undefined}
            >
              {loading ? 'Moving...' : 'Move'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
