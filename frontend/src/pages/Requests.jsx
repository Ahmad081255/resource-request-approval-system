import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Stamp from '../components/Stamp';
import { Inbox, FileSpreadsheet, Edit3, X, ArrowRight, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  // Modify & Resubmit modal state
  const [editingRequest, setEditingRequest] = useState(null);
  const [editForm, setEditForm] = useState({ resource_type: '', resource_id: '', quantity: 1, purpose: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const isStaff = user.role_name === 'Staff';

  async function loadRequests() {
    try {
      const data = await api.get('/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
    api.get('/resources')
      .then((data) => setResources(Array.isArray(data) ? data : []))
      .catch(() => setResources([]));
  }, []);

  function openModifyModal(reqItem) {
    setEditingRequest(reqItem);
    setEditForm({
      resource_type: reqItem.resource_type || '',
      resource_id: reqItem.resource_id ? String(reqItem.resource_id) : '',
      quantity: reqItem.quantity || 1,
      purpose: reqItem.purpose || ''
    });
    setEditError('');
    setSuccess('');
  }

  function handleCataloguePick(id) {
    const picked = resources.find((r) => String(r.resource_id) === id);
    setEditForm((f) => ({
      ...f,
      resource_id: id,
      resource_type: picked ? picked.name : f.resource_type
    }));
  }

  async function handleResubmit(e) {
    e.preventDefault();
    if (!editingRequest) return;
    setEditError('');
    setSavingEdit(true);
    try {
      await api.put(`/requests/${editingRequest.request_id}`, {
        resource_type: editForm.resource_type,
        resource_id: editForm.resource_id || null,
        quantity: Number(editForm.quantity),
        purpose: editForm.purpose
      });
      setSuccess(`Request #${editingRequest.request_id} modified and resubmitted for approval.`);
      setEditingRequest(null);
      await loadRequests();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setEditError(err.message || 'Failed to resubmit request.');
    } finally {
      setSavingEdit(false);
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const filters = [
    { key: 'all', label: 'All Requests', count: requests.length },
    { key: 'pending', label: 'Pending', count: requests.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: requests.filter((r) => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length },
    { key: 'modification_requested', label: 'Needs Changes', count: requests.filter((r) => r.status === 'modification_requested').length }
  ];

  const hasEditableRows = requests.some(
    (r) => r.user_id === user.user_id && r.status === 'modification_requested'
  );

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
              ? 'Track your requisitions, view approver feedback, and revise any requests sent back for modification.'
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
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modify & Resubmit Inline Editor Panel */}
      {editingRequest && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-purple-300 dark:border-purple-700 shadow-lg space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Revise & Resubmit Request #{editingRequest.request_id}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Update Requisition Details
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setEditingRequest(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {editingRequest.latest_remarks && (
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 text-xs text-purple-900 dark:text-purple-200">
              <div className="font-mono font-bold uppercase tracking-wider text-[10px] text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Approver Remarks ({editingRequest.latest_approver_name || 'Reviewer'})</span>
              </div>
              <p className="leading-relaxed">{editingRequest.latest_remarks}</p>
            </div>
          )}

          {editError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleResubmit} className="space-y-4">
            {resources.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Catalogue Item (Optional)
                </label>
                <select
                  value={editForm.resource_id}
                  onChange={(e) => handleCataloguePick(e.target.value)}
                  className="block w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">— Keep custom item or pick from catalogue —</option>
                  {resources.map((res) => (
                    <option key={res.resource_id} value={res.resource_id}>
                      {res.name} — ({res.quantity ?? res.available_quantity ?? 0} in stock)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Resource Name / Item
                </label>
                <input
                  type="text"
                  required
                  value={editForm.resource_type}
                  onChange={(e) => setEditForm((f) => ({ ...f, resource_type: e.target.value }))}
                  className="block w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editForm.quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="block w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Updated Purpose / Justification
              </label>
              <textarea
                rows={3}
                required
                value={editForm.purpose}
                onChange={(e) => setEditForm((f) => ({ ...f, purpose: e.target.value }))}
                className="block w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setEditingRequest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="resubmit-request-btn"
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{savingEdit ? 'Resubmitting…' : 'Save & Resubmit for Approval'}</span>
                {!savingEdit && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading requests…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
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
                  <th className="py-3.5 px-4 font-semibold">Purpose & Remarks</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  {hasEditableRows && <th className="py-3.5 px-4 font-semibold text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filtered.map((r) => {
                  const canModify = r.user_id === user.user_id && r.status === 'modification_requested';
                  return (
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
                        <div>{r.purpose}</div>
                        {r.latest_remarks && (
                          <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                              {r.latest_approver_name ? `${r.latest_approver_name}: ` : 'Remarks: '}
                            </span>
                            {r.latest_remarks}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(r.request_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Stamp status={r.status} />
                      </td>
                      {hasEditableRows && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {canModify ? (
                            <button
                              id={`modify-request-btn-${r.request_id}`}
                              onClick={() => openModifyModal(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modify & Resubmit</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
