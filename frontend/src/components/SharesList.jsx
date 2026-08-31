import { useState, useEffect } from 'react';
import api from '../api/axios';
import './SharesList.css';

export default function SharesList({ itemId, itemType }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    loadShares();
  }, [itemId, itemType]);

  const loadShares = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/shares');
      
      // Filter shares for this specific item
      const itemShares = res.data.filter(share => {
        if (itemType === 'file') return share.fileId === itemId;
        if (itemType === 'folder') return share.folderId === itemId;
        if (itemType === 'dataRoom') return share.dataRoomId === itemId;
        return false;
      });
      
      setShares(itemShares);
    } catch (err) {
      console.error('Error loading shares:', err);
      setError('Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (shareId) => {
    if (!window.confirm('Are you sure you want to revoke this share?')) return;

    setRevoking(shareId);
    try {
      await api.delete(`/shares/${shareId}`);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err) {
      console.error('Error revoking share:', err);
      setError('Failed to revoke share: ' + (err.response?.data?.error || err.message));
    } finally {
      setRevoking(null);
    }
  };

  const getShareDescription = (share) => {
    if (share.type === 'public') {
      return `🌐 Public link - Anyone with link can view`;
    } else {
      const userCount = share.sharedWith?.length || 0;
      return `👥 Permissioned - ${userCount} user${userCount !== 1 ? 's' : ''} can view`;
    }
  };

  const getExpirationText = (expiresAt) => {
    if (!expiresAt) return 'No expiration';
    const date = new Date(expiresAt);
    const now = new Date();
    
    if (date < now) {
      return 'Expired';
    }
    
    const days = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  if (loading) {
    return <div className="shares-list-loading">Loading shares...</div>;
  }

  if (shares.length === 0) {
    return <div className="shares-list-empty">No active shares</div>;
  }

  return (
    <div className="shares-list">
      <h3>Active Shares ({shares.length})</h3>
      
      {error && <div className="shares-list-error">{error}</div>}

      <div className="shares-list-items">
        {shares.map(share => (
          <div key={share.id} className="share-item">
            <div className="share-info">
              <div className="share-description">{getShareDescription(share)}</div>
              <div className="share-expiration">{getExpirationText(share.expiresAt)}</div>
              
              {share.type === 'permissioned' && share.sharedWith && share.sharedWith.length > 0 && (
                <div className="share-users">
                  <strong>Shared with:</strong>
                  <ul>
                    {share.sharedWith.map(access => (
                      <li key={access.userId}>
                        {access.user.name || access.user.email}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {share.type === 'public' && share.token && (
                <div className="share-token">
                  <strong>Share link:</strong>
                  <div className="token-display">
                    <code>{window.location.origin}/share/{share.token}</code>
                    <button
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share/${share.token}`);
                        alert('Link copied to clipboard!');
                      }}
                      title="Copy link"
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="revoke-btn"
              onClick={() => handleRevoke(share.id)}
              disabled={revoking === share.id}
              title="Revoke this share"
            >
              {revoking === share.id ? 'Revoking...' : '🗑️ Revoke'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
