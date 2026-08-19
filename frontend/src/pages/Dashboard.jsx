import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Stamp from '../components/Stamp';

export default function Dashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const isApprover = user.role_name === 'Manager' || user.role_name === 'Administrator';

  useEffect(() => {
    async function load() {
      try {
        const reqs = await api.get('/requests');
        setRequests(reqs);
        if (isApprover) {
          const s = await api.get('/reports/summary');
          setSummary(s);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isApprover]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="page-title">{user.full_name}</h1>
          <p className="page-subtitle">
            {user.role_name === 'Staff' && 'Track your resource requests and submit new ones below.'}
            {user.role_name === 'Manager' && 'Review pending requests and monitor departmental activity.'}
            {user.role_name === 'Administrator' && 'Full oversight of users, resources, and system activity.'}
          </p>
        </div>
        {user.role_name === 'Staff' && (
          <Link to="/new-request" className="btn btn-primary">+ New Request</Link>
        )}
      </div>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-number">{requests.length}</div>
          <div className="stat-label">{user.role_name === 'Staff' ? 'My Requests' : 'Total Requests'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--pending)' }}>{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--approved)' }}>{approvedCount}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: 'var(--rejected)' }}>{rejectedCount}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      {isApprover && summary && summary.byDepartment.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p className="eyebrow">By Department</p>
          <div className="grid grid-3">
            {summary.byDepartment.map((d) => (
              <div key={d.department_name || 'none'}>
                <div className="stat-number" style={{ fontSize: '1.4rem' }}>{d.count}</div>
                <div className="stat-label">{d.department_name || 'Unassigned'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <p className="eyebrow">Recent Activity</p>
        {loading ? (
          <p className="page-subtitle">Loading…</p>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">🗂</div>
            <p>No requests yet. {user.role_name === 'Staff' && 'Submit your first request to get started.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Request</th>
                {!isStaffOnly(user) && <th>Requester</th>}
                <th>Quantity</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.slice(0, 6).map((r) => (
                <tr key={r.request_id}>
                  <td>{r.resource_type}</td>
                  {!isStaffOnly(user) && <td>{r.requester_name}</td>}
                  <td className="mono">{r.quantity}</td>
                  <td className="mono">{new Date(r.request_date).toLocaleDateString()}</td>
                  <td><Stamp status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 14 }}>
          <Link to="/requests" className="btn btn-ghost btn-sm">View all requests →</Link>
        </div>
      </div>
    </div>
  );
}

function isStaffOnly(user) {
  return user.role_name === 'Staff';
}
