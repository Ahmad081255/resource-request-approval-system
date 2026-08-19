import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ department_name: '', location: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setDepartments(await api.get('/departments'));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm({ department_name: '', location: '', description: '' });
    setShowForm(true);
    setError('');
  }

  function startEdit(dept) {
    setEditingId(dept.department_id);
    setForm({ department_name: dept.department_name, location: dept.location || '', description: dept.description || '' });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, form);
      } else {
        await api.post('/departments', form);
      }
      setShowForm(false);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this department? Users currently assigned to it must be reassigned first.')) return;
    try {
      await api.del(`/departments/${id}`);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage the departments staff can belong to and register under.</p>
        </div>
        <button className="btn btn-primary" onClick={() => (showForm ? setShowForm(false) : startCreate())}>
          {showForm ? 'Cancel' : '+ New Department'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 480 }}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Department name</label>
              <input value={form.department_name} onChange={(e) => update('department_name', e.target.value)} required />
            </div>
            <div className="field">
              <label>Location</label>
              <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. 2nd Floor" />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit">{editingId ? 'Save Changes' : 'Add Department'}</button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <p className="page-subtitle">Loading…</p> : departments.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">🏢</div>
            <p>No departments yet. Add one so staff can register under it.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Location</th><th>Description</th><th></th></tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.department_id}>
                  <td>{d.department_name}</td>
                  <td>{d.location || '—'}</td>
                  <td style={{ maxWidth: 320 }}>{d.description || '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(d)}>Edit</button>
                    <button className="btn btn-reject btn-sm" onClick={() => handleDelete(d.department_id)}>Delete</button>
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
