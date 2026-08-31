import { useState } from 'react';
import api from '../api/axios';
import SharesList from './SharesList';
import './ShareModal.css';

export default function ShareModal({ itemId, itemType, itemName, onClose, onShareSuccess }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'manage'
  const [emails, setEmails] = useState('');
  const [shareType, setShareType] = useState('permissioned'); // 'permissioned' or 'public'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [publicLink, setPublicLink] = useState('');

  const handleCreateShare = async () => {
    if (shareType === 'permissioned' && !emails.trim()) {
      setError('Please enter at least one email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        type: shareType,
      };

      // Parse emails for permissioned share
      if (shareType === 'permissioned') {
        const emailList = emails
          .split(',')
          .map(e => e.trim())
          .filter(e => e.length > 0);

        if (emailList.length === 0) {
          setError('No valid emails found');
          setLoading(false);
          return;
        }

        payload.emails = emailList;
      }

      // Add the item reference based on type
      if (itemType === 'file') {
        payload.fileId = itemId;
      } else if (itemType === 'folder') {
        payload.folderId = itemId;
      } else if (itemType === 'dataRoom') {
        payload.dataRoomId = itemId;
      }

      const res = await api.post('/shares', payload);

      if (shareType === 'public') {
        setPublicLink(`${window.location.origin}/share/${res.data.token}`);
        setSuccess('Public link created! Click "Copy" to get the link.');
      } else {
        setSuccess(`Shared "${itemName}" with ${emails.split(',').length} user(s)!`);
        setEmails('');
      }

      // Call parent's callback
      if (onShareSuccess) {
        onShareSuccess(res.data);
      }

      // Switch to manage tab to see the new share
      setActiveTab('manage');
    } catch (err) {
      console.error('Error sharing:', err);
      setError(err.response?.data?.error || 'Failed to share');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share "{itemName}"</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            📤 Create Share
          </button>
          <button
            className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            ⚙️ Manage Shares
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'create' ? (
            <>
              {/* Share Type Selection */}
              <div className="share-type-selection">
                <label>
                  <input
                    type="radio"
                    value="permissioned"
                    checked={shareType === 'permissioned'}
                    onChange={(e) => setShareType(e.target.value)}
                  />
                  <span>Share with specific people</span>
                </label>
                <label>
                  <input
                    type="radio"
                    value="public"
                    checked={shareType === 'public'}
                    onChange={(e) => setShareType(e.target.value)}
                  />
                  <span>Create public link (anyone with link can view)</span>
                </label>
              </div>

              {/* Permissioned Share Form */}
              {shareType === 'permissioned' && (
                <div className="share-form">
                  <label>
                    Enter emails (comma-separated):
                    <textarea
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      placeholder="user1@example.com, user2@example.com"
                      rows={4}
                      disabled={loading}
                    />
                  </label>
                </div>
              )}

              {/* Public Share Info */}
              {shareType === 'public' && (
                <div className="public-share-info">
                  <p>Anyone with the link can view this {itemType}.</p>
                  {publicLink && (
                    <div className="public-link-display">
                      <input
                        type="text"
                        value={publicLink}
                        readOnly
                        className="public-link-input"
                      />
                      <button
                        className="copy-link-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(publicLink);
                          alert('Link copied to clipboard!');
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
            </>
          ) : (
            <>
              {/* Manage Shares Tab */}
              <SharesList itemId={itemId} itemType={itemType} />
            </>
          )}
        </div>

        {activeTab === 'create' && (
          <div className="modal-footer">
            <button
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="share-btn"
              onClick={handleCreateShare}
              disabled={loading}
            >
              {loading ? 'Creating share...' : 'Create Share'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
