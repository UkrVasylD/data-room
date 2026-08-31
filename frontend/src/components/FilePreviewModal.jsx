import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import './FilePreviewModal.css';

// Set up PDF.js worker - use local version from public folder
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export default function FilePreviewModal({ file, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Get MIME type from file prop or detect from extension
  const getMimeType = (fileName, currentMimeType) => {
    // If mimeType already provided, use it
    if (currentMimeType && currentMimeType !== 'undefined') {
      return currentMimeType;
    }
    
    // Otherwise detect from file extension
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      txt: 'text/plain',
      md: 'text/markdown',
      csv: 'text/csv',
      json: 'application/json',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  const mimeType = getMimeType(file.name, file.mimeType);
  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const isText = mimeType.startsWith('text/') || mimeType === 'application/json';

  useEffect(() => {
    // Use file.url directly (Supabase URLs are public)
    if (mimeType === 'application/pdf' && file.url) {
      setPdfUrl(file.url);
    } else if (mimeType?.startsWith('image/') && file.url) {
      // For images, use URL directly
      setImageUrl(file.url);
    }

    return () => {
      // No need to revoke Supabase URLs as they're external
    };
  }, [mimeType, file.url]);

  const handlePdfLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handlePdfLoadError = (err) => {
    console.error('PDF.js error:', err);
    setError(`Failed to load PDF: ${err.message || err}`);
  };

  const handleDownload = async () => {
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

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h2 className="preview-title">{file.name}</h2>
          <div className="preview-actions">
            <button
              className="preview-download-btn"
              onClick={handleDownload}
              title="Download file"
            >
              ⬇️ Download
            </button>
            <button
              className="preview-close-btn"
              onClick={onClose}
              title="Close preview"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="preview-content">
          {error && (
            <div className="preview-error">
              <p>{error}</p>
            </div>
          )}

          {isPdf && !error && (
            <div className="preview-pdf">
              {pdfUrl ? (
                <>
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={handlePdfLoadSuccess}
                    onLoadError={handlePdfLoadError}
                    loading={<div className="preview-loading">Loading PDF...</div>}
                  >
                    <Page pageNumber={pageNumber} />
                  </Document>
                </>
              ) : (
                <div className="preview-loading">Preparing PDF...</div>
              )}

              {numPages && (
                <div className="pdf-controls">
                  <button
                    className="pdf-nav-btn"
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber === 1}
                  >
                    ← Previous
                  </button>
                  <span className="pdf-page-info">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    className="pdf-nav-btn"
                    onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber === numPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          )}

          {isImage && !error && (
            <div className="preview-image">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={file.name}
                  onError={() => setError('Failed to load image')}
                />
              ) : (
                <div className="preview-loading">Loading image...</div>
              )}
            </div>
          )}

          {isText && !error && (
            <div className="preview-text">
              <TextFilePreview fileUrl={file.url} onError={() => setError('Failed to load text file')} />
            </div>
          )}

          {!isPdf && !isImage && !isText && !error && (
            <div className="preview-unsupported">
              <p>Preview not available for this file type</p>
              <p className="preview-hint">
                File type: <code>{mimeType}</code>
              </p>
              <p>You can download the file to view it locally.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to load and display text file content
function TextFilePreview({ fileUrl, onError }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFile = async () => {
      try {
        // Fetch directly from Supabase URL
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load file');
        const text = await response.text();
        setContent(text);
      } catch (err) {
        console.error('Error loading text file:', err);
        onError();
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [fileUrl, onError]);

  if (loading) {
    return <div className="preview-loading">Loading file...</div>;
  }

  return (
    <pre className="text-content">
      <code>{content}</code>
    </pre>
  );
}
