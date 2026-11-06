import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Stamp from '../components/Stamp';
import { Check, X, RefreshCw, AlertCircle, CheckCircle2, Inbox, MessageSquare } from 'lucide-react';

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [remarksDraft, setRemarksDraft] = useState({});
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/requests');
      setRequests(data.filter((r) => r.status === 'pending'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    <div id="approvals-page" className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
          Decision Queue
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Approvals Workflow</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review pending resource requests from staff. Approve, reject, or request modifications.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200/90 dark:border-slate-800 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading approval queue…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-16 border border-slate-200/90 dark:border-slate-800 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Queue is Clear!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            All submitted requisitions have been processed and resolved.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.request_id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 transition-all"
            >
              {/* Top Meta Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                    #{r.request_id}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Requested by <strong className="text-slate-800 dark:text-slate-200">{r.requester_name}</strong>
                  </span>
                  {r.department_name && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                      {r.department_name}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    · {new Date(r.request_date).toLocaleDateString()}
                  </span>
                </div>
                <Stamp status={r.status} />
              </div>

              {/* Resource Content */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {r.resource_type}
                  <span className="ml-2 font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">
                    (Qty: {r.quantity})
                  </span>
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                    Justification / Purpose
                  </div>
                  {r.purpose}
                </div>
              </div>

              {/* Remarks Field */}
              <div>
                <label
                  htmlFor={`remarks-${r.request_id}`}
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Approver Remarks (Optional for approval, recommended for modifications)</span>
                </label>
                <input
                  id={`remarks-${r.request_id}`}
                  type="text"
                  placeholder="e.g. Approved for Phase 1; please check stock room tomorrow…"
                  value={remarksDraft[r.request_id] || ''}
                  onChange={(e) => setRemarksDraft((d) => ({ ...d, [r.request_id]: e.target.value }))}
                  className="block w-full px-3.5 py-2 text-sm bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Decision Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  id={`approve-btn-${r.request_id}`}
                  onClick={() => decide(r.request_id, 'approved')}
                  disabled={actioningId === r.request_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Request</span>
                </button>
                <button
                  id={`reject-btn-${r.request_id}`}
                  onClick={() => decide(r.request_id, 'rejected')}
                  disabled={actioningId === r.request_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  id={`modify-btn-${r.request_id}`}
                  onClick={() => decide(r.request_id, 'modification_requested')}
                  disabled={actioningId === r.request_id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Request Changes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
