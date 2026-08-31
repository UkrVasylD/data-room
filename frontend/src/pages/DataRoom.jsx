import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FileUpload from '../components/FileUpload';
import ShareModal from '../components/ShareModal';
import RenameModal from '../components/RenameModal';
import MoveModal from '../components/MoveModal';
import FilePreviewModal from '../components/FilePreviewModal';
import './DataRoom.css';

/* eslint-disable react-hooks/exhaustive-deps */

export default function DataRoomView() {
  const { roomId } = useParams();
  const [dataRoom, setDataRoom] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareModal, setShareModal] = useState({ show: false, itemId: null, itemType: null, itemName: null });
  const [renameModal, setRenameModal] = useState({ show: false, item: null, itemType: null });
  const [moveModal, setMoveModal] = useState({ show: false, file: null });
  const [previewFile, setPreviewFile] = useState(null);
  const navigate = useNavigate();

  // Функція для завантаження дата руму
  const loadRoomData = async () => {
    try {
      // Тягнемо дата рум (верхньорівневі папки + кореневі файли)
      const res = await api.get(`/data-rooms/${roomId}`);
      setDataRoom(res.data);
      setCurrentFolder(null); // Скидаємо поточну папку
    } catch (err) {
      console.error('Error loading data room:', err);
    }
  };

  // Функція для переходу в папку
  const handleFolderClick = async (folder) => {
    try {
      // Тягнемо дані папки (дочірні папки + файли в папці)
      const res = await api.get(`/folders/${folder.id}`);
      setCurrentFolder(res.data);
    } catch (err) {
      console.error('Error loading folder:', err);
    }
  };

  // Функція для повернення до дата руму
  const handleRootClick = () => {
    setCurrentFolder(null);
  };

  // Функція для відкриття модалі поділення
  const openShareModal = (itemId, itemType, itemName) => {
    setShareModal({ show: true, itemId, itemType, itemName });
  };

  // Функція для закриття модалі поділення
  const closeShareModal = () => {
    setShareModal({ show: false, itemId: null, itemType: null, itemName: null });
  };

  // Функція для відкриття модалі перейменування
  const openRenameModal = (item, itemType) => {
    setRenameModal({ show: true, item, itemType });
  };

  // Функція для закриття модалі перейменування
  const closeRenameModal = () => {
    setRenameModal({ show: false, item: null, itemType: null });
  };

  // Функція для відкриття модалі переміщення
  const openMoveModal = (file) => {
    setMoveModal({ show: true, file });
  };

  // Функція для закриття модалі переміщення
  const closeMoveModal = () => {
    setMoveModal({ show: false, file: null });
  };

  // Функція для оновлення після успішного rename/move
  const handleRefreshData = async () => {
    if (currentFolder) {
      const res = await api.get(`/folders/${currentFolder.id}`);
      setCurrentFolder(res.data);
    } else {
      await loadRoomData();
    }
  };

  // Загружаємо дані при завантаженні компонента
  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  // Оновлюємо breadcrumbs коли меняється currentFolder
  useEffect(() => {
    if (!currentFolder) {
      // Ми в корені дата руму
      if (dataRoom) {
        setBreadcrumbs([{ id: roomId, name: dataRoom.name }]);
      }
    } else {
      // Ми в папці
      setBreadcrumbs([
        { id: roomId, name: dataRoom?.name || 'DataRoom' },
        { id: currentFolder.id, name: currentFolder.name }
      ]);
    }
  }, [currentFolder, dataRoom, roomId]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await api.post('/folders', {
        name: newFolderName,
        dataRoomId: roomId,
        parentId: currentFolder?.id || null,
      });
      setNewFolderName('');
      // Перезавантажуємо дані поточної папки
      if (currentFolder) {
        const res = await api.get(`/folders/${currentFolder.id}`);
        setCurrentFolder(res.data);
      } else {
        await loadRoomData();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      alert('Error creating folder: ' + err.response?.data?.error || err.message);
    }
  };

  const handleFileUpload = async (files) => {
    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dataRoomId', roomId);
      formData.append('folderId', currentFolder?.id || '');

      try {
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } catch (err) {
        console.error('Error uploading file:', err);
      }
    }
    // Перезавантажуємо дані після всіх завантажень
    if (currentFolder) {
      const res = await api.get(`/folders/${currentFolder.id}`);
      setCurrentFolder(res.data);
    } else {
      await loadRoomData();
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      // Перезавантажуємо дані
      if (currentFolder) {
        const res = await api.get(`/folders/${currentFolder.id}`);
        setCurrentFolder(res.data);
      } else {
        await loadRoomData();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Error deleting file: ' + err.response?.data?.error || err.message);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its contents?')) return;

    try {
      await api.delete(`/folders/${folderId}`);
      // Перезавантажуємо дані
      if (currentFolder) {
        const res = await api.get(`/folders/${currentFolder.id}`);
        setCurrentFolder(res.data);
      } else {
        await loadRoomData();
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      alert('Error deleting folder: ' + err.response?.data?.error || err.message);
    }
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
  };

  const handleDownloadFile = async (file) => {
    try {
      // Fetch the file
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Failed to download');
      
      // Get file as blob
      const blob = await response.blob();
      
      // Create blob URL and download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file');
    }
  };

  if (!dataRoom && currentFolder === null) return <div>Loading...</div>;

  return (
    <div className="data-room-view">
      <div className="breadcrumb">
        <button onClick={() => navigate('/')}>← Back</button>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.id}> / {crumb.name}</span>
        ))}
      </div>

      <h2>{currentFolder ? currentFolder.name : dataRoom?.name}</h2>

      <div className="controls">
        <FileUpload onUpload={handleFileUpload} />
        
        <form onSubmit={handleCreateFolder} className="create-folder-form">
          <input
            type="text"
            placeholder="New Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            required
          />
          <button type="submit">Create Folder</button>
        </form>
      </div>

      <div className="contents">
        <div className="folders">
          <h3>Folders</h3>
          
          {/* Кнопка Root (якщо не в корені) */}
          {currentFolder && (
            <div 
              className="folder-item selected"
              onClick={handleRootClick}
            >
              📁 ← Root
            </div>
          )}

          {/* Папки */}
          {(() => {
            const foldersList = !currentFolder
              ? (dataRoom?.folders || [])
              : (currentFolder?.children || []);
            
            return foldersList.length > 0 ? (
              foldersList.map((folder) => (
                <div key={folder.id} className="folder-item-container">
                  <div 
                    className="folder-item"
                    onClick={() => handleFolderClick(folder)}
                  >
                    📁 {folder.name}
                  </div>
                  <button
                    className="rename-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openRenameModal(folder, 'folder');
                    }}
                    title="Rename folder"
                  >
                    🖊️
                  </button>
                  <button
                    className="share-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openShareModal(folder.id, 'folder', folder.name);
                    }}
                    title="Share folder"
                  >
                    👥
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    title="Delete folder"
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <p className="empty">No folders</p>
            );
          })()}
        </div>

        <div className="files">
          <h3>Files</h3>
          {(() => {
            const files = currentFolder ? currentFolder?.files : dataRoom?.files;
            
            return files && files.length > 0 ? (
              files.map((file) => (
                <div key={file.id} className="item-container">
                  <div className="item">
                    <button
                      className="file-preview-btn"
                      onClick={() => handlePreviewFile(file)}
                      title="Preview file"
                    >
                      👁️ {file.name}
                    </button>
                    <small>{(file.size / 1024).toFixed(2)} KB</small>
                  </div>
                  <button
                    className="download-action-btn"
                    onClick={() => handleDownloadFile(file)}
                    title="Download file"
                  >
                    ⬇️
                  </button>
                  <button
                    className="rename-action-btn"
                    onClick={() => openRenameModal(file, 'file')}
                    title="Rename file"
                  >
                    🖊️
                  </button>
                  <button
                    className="move-action-btn"
                    onClick={() => openMoveModal(file)}
                    title="Move file"
                  >
                    →
                  </button>
                  <button
                    className="share-action-btn"
                    onClick={() => openShareModal(file.id, 'file', file.name)}
                    title="Share file"
                  >
                    👥
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteFile(file.id)}
                    title="Delete file"
                  >
                    🗑️
                  </button>
                </div>
              ))
            ) : (
              <p className="empty">No files</p>
            );
          })()}
        </div>
      </div>

      {/* Share Modal */}
      {shareModal.show && (
        <ShareModal
          itemId={shareModal.itemId}
          itemType={shareModal.itemType}
          itemName={shareModal.itemName}
          onClose={closeShareModal}
          onShareSuccess={() => {
            loadRoomData();
          }}
        />
      )}

      {/* Rename Modal */}
      {renameModal.show && (
        <RenameModal
          item={renameModal.item}
          itemType={renameModal.itemType}
          onClose={closeRenameModal}
          onRenameSuccess={handleRefreshData}
        />
      )}

      {/* Move Modal */}
      {moveModal.show && (
        <MoveModal
          file={moveModal.file}
          dataRoomId={roomId}
          currentFolderId={currentFolder?.id}
          onClose={closeMoveModal}
          onMoveSuccess={handleRefreshData}
        />
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
