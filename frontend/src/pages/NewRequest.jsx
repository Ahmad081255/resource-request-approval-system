import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PlusCircle, Boxes, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function NewRequest() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ resource_type: '', resource_id: '', quantity: 1, purpose: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/resources').then(setResources).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleResourcePick(id) {
    const res = resources.find((r) => String(r.resource_id) === id);
    setForm((f) => ({ ...f, resource_id: id, resource_type: res ? res.name : f.resource_type }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/requests', { ...form, resource_id: form.resource_id || null });
      setSuccess('Request submitted successfully! Routing to your departmental approver.');
      setTimeout(() => navigate('/requests'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="new-request-page" className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
          Submission Portal
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Submit a Resource Request</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Specify the items and quantities needed. Your request will be routed for review.
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pick from catalogue */}
          {resources.length > 0 && (
            <div>
              <label htmlFor="catalogue" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Select from Catalogue (Optional)
              </label>
              <div className="relative">
                <select
                  id="catalogue"
                  value={form.resource_id}
                  onChange={(e) => handleResourcePick(e.target.value)}
                  className="block w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                >
                  <option value="">— Type a custom item below or select pre-catalogued —</option>
                  {resources.map((r) => (
                    <option key={r.resource_id} value={r.resource_id}>
                      {r.name} — ({r.quantity} in stock, {r.location || 'Central'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Resource Name */}
          <div>
            <label htmlFor="resource_type" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Resource Name / Item Description
            </label>
            <input
              id="resource_type"
              type="text"
              value={form.resource_type}
              onChange={(e) => update('resource_type', e.target.value)}
              placeholder="e.g. Ergonomic Office Chair, Laptop Dock, Dual Monitor Setup"
              required
              className="block w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Quantity Needed
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              required
              className="block w-full sm:w-36 px-3.5 py-2.5 text-sm font-mono bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Purpose / Justification */}
          <div>
            <label htmlFor="purpose" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
              Business Justification / Purpose
            </label>
            <textarea
              id="purpose"
              rows={4}
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              placeholder="Provide a short explanation of why this resource is required for your project or workflow…"
              required
              className="block w-full px-3.5 py-2.5 text-sm bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              id="submit-request-btn"
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
