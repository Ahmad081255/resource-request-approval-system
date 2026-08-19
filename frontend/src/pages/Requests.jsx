import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Stamp from '../components/Stamp';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const isStaff = user.role_name === 'Staff';

  useEffect(() => {
    api.get('/requests').then(setRequests).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Tracking</p>
          <h1 className="page-title">{isStaff ? 'My Requests' : 'All Requests'}</h1>
          <p className="page-subtitle">Follow the status of {isStaff ? 'your submissions' : 'requests across the organisation'} from submission to decision.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected', 'modification_requested'].map((s) => (
          <button
            key={s}
            className="btn btn-ghost btn-sm"
            style={filter === s ? { background: 'var(--indigo)', color: '#fff', borderColor: 'var(--indigo)' } : {}}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <p className="page-subtitle">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">📭</div>
            <p>No requests match this filter.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Resource</th>
                {!isStaff && <th>Requester</th>}
                <th>Qty</th>
                <th>Purpose</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.request_id}>
                  <td className="mono">#{r.request_id}</td>
                  <td>{r.resource_type}</td>
                  {!isStaff && <td>{r.requester_name}</td>}
                  <td className="mono">{r.quantity}</td>
                  <td style={{ maxWidth: 260 }}>{r.purpose}</td>
                  <td className="mono">{new Date(r.request_date).toLocaleDateString()}</td>
                  <td><Stamp status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
