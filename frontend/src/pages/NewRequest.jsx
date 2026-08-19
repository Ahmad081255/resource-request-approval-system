import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

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
      setSuccess('Request submitted. Your approver has been notified.');
      setTimeout(() => navigate('/requests'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">New Submission</p>
          <h1 className="page-title">Submit a Resource Request</h1>
          <p className="page-subtitle">Fill out the details below — it will be routed to a manager or administrator for review.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form onSubmit={handleSubmit}>
          {resources.length > 0 && (
            <div className="field">
              <label htmlFor="catalogue">Pick from catalogue (optional)</label>
              <select id="catalogue" value={form.resource_id} onChange={(e) => handleResourcePick(e.target.value)}>
                <option value="">— Type a custom item below —</option>
                {resources.map((r) => (
                  <option key={r.resource_id} value={r.resource_id}>{r.name} ({r.quantity} in stock)</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor="resource_type">Resource / item</label>
            <input id="resource_type" value={form.resource_type} onChange={(e) => update('resource_type', e.target.value)} placeholder="e.g. Laptop, Projector, Office Supplies" required />
          </div>

          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input id="quantity" type="number" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} required />
          </div>

          <div className="field">
            <label htmlFor="purpose">Purpose / justification</label>
            <textarea id="purpose" value={form.purpose} onChange={(e) => update('purpose', e.target.value)} placeholder="Briefly explain why this resource is needed" required />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
