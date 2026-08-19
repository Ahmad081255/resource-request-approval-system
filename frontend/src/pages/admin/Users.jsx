import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', role_id: '', department_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [u, meta] = await Promise.all([api.get('/users'), api.get('/users/meta/lookup')]);
    setUsers(u);
    setRoles(meta.roles);
    setDepartments(meta.departments);
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
      await api.post('/users', { ...form, department_id: form.department_id || null });
      setForm({ full_name: '', username: '', email: '', password: '', role_id: '', department_id: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeRole(userId, role_id) {
    await api.patch(`/users/${userId}`, { role_id });
    load();
  }

  async function toggleStatus(userId, currentStatus) {
    if (currentStatus === 'active') {
      await api.del(`/users/${userId}`);
    } else {
      await api.patch(`/users/${userId}`, { status: 'active' });
    }
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Create accounts, assign roles, and manage access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ maxWidth: 520 }}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="grid grid-2">
              <div className="field">
                <label>Full name</label>
                <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
              </div>
              <div className="field">
                <label>Username</label>
                <input value={form.username} onChange={(e) => update('username', e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label>Temporary password</label>
                <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={form.role_id} onChange={(e) => update('role_id', e.target.value)} required>
                  <option value="">Select…</option>
                  {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Department</label>
              <select value={form.department_id} onChange={(e) => update('department_id', e.target.value)}>
                <option value="">— None —</option>
                {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Create User</button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <p className="page-subtitle">Loading…</p> : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Username</th><th>Department</th><th>Role</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.full_name}<div className="mono" style={{ fontSize: '0.75rem' }}>{u.email}</div></td>
                  <td className="mono">{u.username}</td>
                  <td>{u.department_name || '—'}</td>
                  <td>
                    <select value={u.role_id} onChange={(e) => changeRole(u.user_id, e.target.value)}>
                      {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`stamp ${u.status === 'active' ? 'approved' : 'rejected'}`}>{u.status}</span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(u.user_id, u.status)}>
                      {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                    </button>
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
