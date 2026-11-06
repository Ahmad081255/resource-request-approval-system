import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Stamp from '../components/Stamp';
import { FileText, Inbox, Download, FileSpreadsheet } from 'lucide-react';

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

  const filters = [
    { key: 'all', label: 'All Requests', count: requests.length },
    { key: 'pending', label: 'Pending', count: requests.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: requests.filter((r) => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length },
    { key: 'modification_requested', label: 'Needs Changes', count: requests.filter((r) => r.status === 'modification_requested').length }
  ];

  function exportCSV() {
    if (filtered.length === 0) return;
    const headers = ['Request ID', 'Resource', 'Quantity', 'Requester', 'Department', 'Purpose', 'Status', 'Date'];
    const rows = filtered.map((r) => [
      r.request_id,
      `"${(r.resource_type || '').replace(/"/g, '""')}"`,
      r.quantity,
      `"${(r.requester_name || '').replace(/"/g, '""')}"`,
      `"${(r.department_name || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(r.purpose || '').replace(/"/g, '""')}"`,
      r.status,
      new Date(r.request_date).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rram_requests_${filter}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div id="requests-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            Tracking & History
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {isStaff ? 'My Requests' : 'All Organization Requests'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isStaff
              ? 'Track the lifecycle of your requisitions from pending review to approval.'
              : 'Audit and track resource requisition logs across all staff members.'}
          </p>
        </div>

        {filtered.length > 0 && (
          <button
            id="export-requests-btn"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export View (CSV)</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading requests…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No requests found</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no resource requests matching this filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 font-semibold">ID</th>
                  <th className="py-3.5 px-4 font-semibold">Resource Details</th>
                  {!isStaff && <th className="py-3.5 px-4 font-semibold">Requester</th>}
                  <th className="py-3.5 px-4 font-semibold">Qty</th>
                  <th className="py-3.5 px-4 font-semibold">Purpose</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filtered.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                      #{r.request_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{r.resource_type}</div>
                      {r.department_name && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          {r.department_name}
                        </div>
                      )}
                    </td>
                    {!isStaff && (
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{r.requester_name}</div>
                      </td>
                    )}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {r.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs text-xs leading-relaxed">
                      {r.purpose}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(r.request_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Stamp status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
