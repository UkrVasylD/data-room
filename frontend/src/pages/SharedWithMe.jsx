import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import SharedFolderView from '../components/SharedFolderView';
import FilePreviewModal from '../components/FilePreviewModal';
import './SharedWithMe.css';

export default function SharedWithMe() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingFolder, setViewingFolder] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const navigate = useNavigate();

  const loadSharedItems = async () => {
    try {
      const res = await api.get('/shares/shared-with/me');
      console.log('Shares API Response:', res.data);
      setShares(Array.isArray(res.data) ? res.data : res.data.shares || []);
    } catch (err) {
      console.error('Error loading shared items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedItems();
  }, []);

  const getItemType = (share) => {
    if (share.share.fileId) return 'File';
    if (share.share.folderId) return 'Folder';
    if (share.share.dataRoomId) return 'Data Room';
    return 'Unknown';
  };

  const getItemName = (share) => {
    if (share.share.file) return share.share.file.name;
    if (share.share.folder) return share.share.folder.name;
    if (share.share.dataRoom) return share.share.dataRoom.name;
    return 'Unnamed';
  };

  const getOwnerName = (share) => {
    return share.share.owner.name || share.share.owner.email;
  };

  const handlePreviewFile = (share, e) => {
    if (e) e.stopPropagation();
    const file = share.share.file;
    
    // Fetch file metadata to get the URL
    api.get(`/files/${share.share.fileId}`).then(res => {
      setPreviewFile({
        ...file,
        id: share.share.fileId,
        mimeType: file.mimeType,
        url: res.data.url,
      });
    }).catch(err => {
      console.error('Error loading file metadata:', err);
      alert('Failed to load file');
    });
  };

  const handleDownloadFromPreview = async (file) => {
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

  const handleViewItem = async (share, e) => {
    if (e) e.stopPropagation();
    
    console.log('Viewing item:', share.share);
    
    if (share.share.dataRoomId) {
      navigate(`/room/${share.share.dataRoomId}`);
    } else if (share.share.folderId) {
      setViewingFolder({
        id: share.share.folderId,
        name: share.share.folder.name,
      });
    }
  };

  if (loading) return <div className="shared-page">Loading...</div>;

  // Show folder view if user is viewing a folder
  if (viewingFolder) {
    return (
      <SharedFolderView
        folderId={viewingFolder.id}
        folderName={viewingFolder.name}
        onBack={() => setViewingFolder(null)}
      />
    );
  }

  return (
    <div className="shared-page">
      <div className="shared-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Back to Dashboard</button>
        <h1>📤 Shared with Me</h1>
      </div>

      {shares.length === 0 ? (
        <div className="no-shares">
          <p>No one has shared anything with you yet.</p>
        </div>
      ) : (
        <div className="shares-grid">
          {shares.map((share) => (
            <div key={share.id} className="share-card">
              <div className="share-header-card">
                <div className="share-type-badge">
                  {getItemType(share) === 'File' && '📄'}
                  {getItemType(share) === 'Folder' && '📁'}
                  {getItemType(share) === 'Data Room' && '🏢'}
                  <span className="badge-text">{getItemType(share)}</span>
                </div>
                <div className="share-date">
                  {new Date(share.share.createdAt).toLocaleDateString()}
                </div>
              </div>

              <h3 className="share-title">{getItemName(share)}</h3>

              <div className="share-owner">
                <strong>Shared by:</strong> {getOwnerName(share)}
              </div>

              {share.share.expiresAt && (
                <div className="share-expires">
                  <small>
                    Expires: {new Date(share.share.expiresAt).toLocaleDateString()}
                  </small>
                </div>
              )}

              <div className="share-actions">
                {getItemType(share) === 'File' ? (
                  <button
                    className="action-btn preview-btn"
                    onClick={(e) => handlePreviewFile(share, e)}
                  >
                    👁️ Preview
                  </button>
                ) : (
                  <button
                    className="action-btn view-btn"
                    onClick={(e) => handleViewItem(share, e)}
                  >
                    👁️ View
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          fileUrl={previewFile.url}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownloadFromPreview}
        />
      )}
    </div>
  );
}
