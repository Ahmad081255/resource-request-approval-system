import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Stamp from '../components/Stamp';

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [remarksDraft, setRemarksDraft] = useState({});
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const data = await api.get('/requests');
    setRequests(data.filter((r) => r.status === 'pending'));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function decide(id, decision) {
    setError('');
    setActioningId(id);
    try {
      await api.patch(`/requests/${id}/decision`, { decision, remarks: remarksDraft[id] || '' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Review Queue</p>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Requests awaiting your decision. Approve, reject, or send back for changes.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="page-subtitle">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="glyph">✅</div>
            <p>Nothing pending — the queue is clear.</p>
          </div>
        </div>
      ) : (
        requests.map((r) => (
          <div className="card" key={r.request_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <p className="eyebrow">Request #{r.request_id} · {r.department_name || 'No department'}</p>
                <h3 style={{ margin: '0 0 4px 0' }}>{r.resource_type} — Qty {r.quantity}</h3>
                <p style={{ margin: 0, color: '#6b6558', fontSize: '0.88rem' }}>
                  Requested by <strong>{r.requester_name}</strong> on {new Date(r.request_date).toLocaleDateString()}
                </p>
              </div>
              <Stamp status={r.status} />
            </div>

            <p style={{ background: 'var(--paper-dim)', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem' }}>
              {r.purpose}
            </p>

            <div className="field">
              <label htmlFor={`remarks-${r.request_id}`}>Remarks (optional)</label>
              <input
                id={`remarks-${r.request_id}`}
                placeholder="Add a note for the requester…"
                value={remarksDraft[r.request_id] || ''}
                onChange={(e) => setRemarksDraft((d) => ({ ...d, [r.request_id]: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-approve" disabled={actioningId === r.request_id} onClick={() => decide(r.request_id, 'approved')}>
                Approve
              </button>
              <button className="btn btn-reject" disabled={actioningId === r.request_id} onClick={() => decide(r.request_id, 'rejected')}>
                Reject
              </button>
              <button className="btn btn-ghost" disabled={actioningId === r.request_id} onClick={() => decide(r.request_id, 'modification_requested')}>
                Request Changes
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
