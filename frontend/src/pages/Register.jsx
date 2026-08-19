import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', department_id: '' });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments').then(setDepartments).catch(() => {});
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, department_id: form.department_id || null });
      setSuccess('Account created. Redirecting to login…');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Create your account</div>
        <div className="auth-tagline">Registers as Staff</div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="full_name">Full name</label>
            <input id="full_name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={form.username} onChange={(e) => update('username', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
          </div>
          <div className="field">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={form.department_id}
              onChange={(e) => update('department_id', e.target.value)}
              required
              disabled={departments.length === 0}
            >
              <option value="">{departments.length === 0 ? 'No departments available yet' : 'Select your department…'}</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
              ))}
            </select>
            {departments.length === 0 && (
              <p className="field-hint">Ask your administrator to add a department before you register.</p>
            )}
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
