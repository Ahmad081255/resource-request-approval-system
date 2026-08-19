import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetLink('');
    setLoading(true);
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      if (data.resetLink) setResetLink(data.resetLink);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">Reset your password</div>
        <div className="auth-tagline">We'll help you back in</div>

        {error && <div className="error-banner">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        {!resetLink && (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Account email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        {resetLink && (
          <div className="demo-box">
            THIS IS A DEMO ENVIRONMENT — no email server is configured, so here's your link directly:
            <br /><br />
            <Link to={resetLink.replace(window.location.origin, '')} style={{ color: 'var(--indigo)', wordBreak: 'break-all' }}>
              {resetLink}
            </Link>
            <br /><br />
            In a live deployment this would be emailed instead of shown on screen.
          </div>
        )}

        <div className="auth-switch">
          <Link to="/login">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
