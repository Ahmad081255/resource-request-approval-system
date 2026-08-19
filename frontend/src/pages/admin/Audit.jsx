import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/audit').then(setLogs).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Accountability</p>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-subtitle">A record of user activity across the system, most recent first.</p>
        </div>
      </div>

      <div className="card">
        {loading ? <p className="page-subtitle">Loading…</p> : (
          <table>
            <thead>
              <tr><th>When</th><th>User</th><th>Action</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.log_id}>
                  <td className="mono">{new Date(l.created_at).toLocaleString()}</td>
                  <td>{l.full_name || 'Unknown'}</td>
                  <td className="mono">{l.action}</td>
                  <td>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
