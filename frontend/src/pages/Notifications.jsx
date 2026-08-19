import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api.get('/notifications');
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    load();
  }

  async function markRead(id) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Updates on request submissions and decisions.</p>
        </div>
        {items.some((n) => !n.is_read) && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <p className="page-subtitle">Loading…</p>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">🔔</div>
            <p>No notifications yet.</p>
          </div>
        ) : (
          items.map((n) => (
            <div
              key={n.notification_id}
              onClick={() => !n.is_read && markRead(n.notification_id)}
              style={{
                padding: '14px 4px',
                borderBottom: '1px solid var(--paper-line)',
                cursor: n.is_read ? 'default' : 'pointer',
                opacity: n.is_read ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{n.message}</p>
                {!n.is_read && <span className="stamp pending" style={{ transform: 'none' }}>New</span>}
              </div>
              <p className="mono" style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
