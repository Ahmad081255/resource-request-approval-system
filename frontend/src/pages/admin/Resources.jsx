import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminResources() {
  const [resources, setResources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', quantity: 0, description: '', location: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setResources(await api.get('/resources'));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/resources', form);
      setForm({ name: '', quantity: 0, description: '', location: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateResource(res, changes) {
    await api.put(`/resources/${res.resource_id}`, { ...res, ...changes });
    load();
  }

  async function removeResource(id) {
    if (!confirm('Remove this resource from the catalogue?')) return;
    await api.del(`/resources/${id}`);
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">Maintain the catalogue of organisational resources available for request.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New Resource'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 480 }}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label>Quantity in stock</label>
                <input type="number" min="0" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
              </div>
              <div className="field">
                <label>Location</label>
                <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. IT Store" />
              </div>
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit">Add Resource</button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <p className="page-subtitle">Loading…</p> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Qty</th><th>Location</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.resource_id}>
                  <td>{r.name}<div className="mono" style={{ fontSize: '0.75rem' }}>{r.description}</div></td>
                  <td className="mono">
                    <input
                      type="number"
                      style={{ width: 70, padding: '4px 6px' }}
                      defaultValue={r.quantity}
                      onBlur={(e) => updateResource(r, { quantity: e.target.value })}
                    />
                  </td>
                  <td>{r.location || '—'}</td>
                  <td>
                    <span className={`stamp ${r.status === 'available' ? 'approved' : 'rejected'}`}>{r.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateResource(r, { status: r.status === 'available' ? 'unavailable' : 'available' })}
                    >
                      Toggle
                    </button>
                    <button className="btn btn-reject btn-sm" onClick={() => removeResource(r.resource_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
