import { useState, useEffect } from 'react';
import api from '../api/axios';
import FilePreviewModal from './FilePreviewModal';
import './SharedFolderView.css';

export default function SharedFolderView({ folderId, folderName, onBack }) {
  const [folder, setFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    loadFolder(folderId);
    setBreadcrumbs([{ id: folderId, name: folderName }]);
  }, [folderId, folderName]);

  const loadFolder = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/folders/${id}`);
      setFolder(res.data);
    } catch (err) {
      console.error('Error loading folder:', err);
      alert('Failed to load folder: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = async (subfolder) => {
    loadFolder(subfolder.id);
    setBreadcrumbs([...breadcrumbs, { id: subfolder.id, name: subfolder.name }]);
  };

  const handleBreadcrumbClick = (index) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    loadFolder(newBreadcrumbs[index].id);
  };

  const handleDownloadFile = async (file, e) => {
    if (e) e.stopPropagation();

    try {
      const response = await api.get(`/files/${file.id}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.name || 'file');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file: ' + (err.response?.data?.error || err.message));
    }
  };

  const getFilePreviewUrl = (fileId) => {
    // Will fetch file metadata to get URL
    return fileId;
  };

  const handlePreviewFile = (file, e) => {
    if (e) e.stopPropagation();
    // Fetch file metadata to get the URL
    api.get(`/files/${file.id}`).then(res => {
      setPreviewFile({
        ...file,
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

  if (loading) {
    return <div className="shared-folder-view">Loading folder...</div>;
  }

  if (!folder) {
    return <div className="shared-folder-view">Folder not found</div>;
  }

  return (
    <div className="shared-folder-view">
      <div className="folder-header">
        <button className="back-btn" onClick={onBack}>← Back to Shared</button>
        
        <div className="breadcrumbs">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="breadcrumb-item">
              <button
                className="breadcrumb-btn"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {crumb.name}
              </button>
              {index < breadcrumbs.length - 1 && <span className="breadcrumb-sep">/</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="folder-content">
        {folder.children && folder.children.length > 0 && (
          <div className="folders-section">
            <h3>📁 Folders</h3>
            <div className="items-list">
              {folder.children.map((subfolder) => (
                <div key={subfolder.id} className="item-row folder-row" onClick={() => handleFolderClick(subfolder)}>
                  <span className="item-icon">📁</span>
                  <span className="item-name">{subfolder.name}</span>
                  <span className="item-action">→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {folder.files && folder.files.length > 0 && (
          <div className="files-section">
            <h3>📄 Files</h3>
            <div className="items-list">
              {folder.files.map((file) => (
                <div key={file.id} className="item-row file-row">
                  <span className="item-icon">📄</span>
                  <div className="item-info">
                    <span className="item-name">{file.name}</span>
                    <span className="item-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div className="file-actions">
                    <button
                      className="preview-file-btn"
                      onClick={(e) => handlePreviewFile(file, e)}
                      title="Preview file"
                    >
                      👁️
                    </button>
                    <button
                      className="download-file-btn"
                      onClick={(e) => handleDownloadFile(file, e)}
                      title="Download file"
                    >
                      ⬇️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!folder.children || folder.children.length === 0) &&
         (!folder.files || folder.files.length === 0) && (
          <div className="empty-folder">
            <p>This folder is empty</p>
          </div>
        )}
      </div>

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
