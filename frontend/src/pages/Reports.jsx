import { useEffect, useState } from 'react';
import { api } from '../api/client';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  modification_requested: 'Needs Changes'
};

export default function Reports() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/reports/summary').then(setSummary);
  }, []);

  if (!summary) return <p className="page-subtitle">Loading…</p>;

  const maxStatusCount = Math.max(...summary.statusCounts.map((s) => s.count), 1);

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Organisational Overview</p>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Aggregated view of request volume, outcomes, and resource demand.</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <p className="eyebrow">Requests by Status</p>
          {summary.statusCounts.map((s) => (
            <div key={s.status} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                <span>{STATUS_LABELS[s.status] || s.status}</span>
                <span className="mono">{s.count}</span>
              </div>
              <div style={{ background: 'var(--paper-dim)', borderRadius: 6, height: 8 }}>
                <div style={{
                  width: `${(s.count / maxStatusCount) * 100}%`,
                  background: 'var(--indigo)',
                  height: 8,
                  borderRadius: 6
                }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <p className="eyebrow">Top Requested Resources</p>
          <table>
            <thead>
              <tr><th>Resource</th><th>Requests</th><th>Total Qty</th></tr>
            </thead>
            <tbody>
              {summary.topResources.map((r) => (
                <tr key={r.resource_type}>
                  <td>{r.resource_type}</td>
                  <td className="mono">{r.count}</td>
                  <td className="mono">{r.total_quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <p className="eyebrow">By Department</p>
        <div className="grid grid-3">
          {summary.byDepartment.map((d) => (
            <div key={d.department_name || 'none'} className="stat-card" style={{ boxShadow: 'none', border: '1px solid var(--paper-line)' }}>
              <div className="stat-number" style={{ fontSize: '1.5rem' }}>{d.count}</div>
              <div className="stat-label">{d.department_name || 'Unassigned'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
