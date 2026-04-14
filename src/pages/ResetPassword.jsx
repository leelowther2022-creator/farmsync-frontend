import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get('token');

  const [form, setForm]       = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 12 }}>Invalid reset link.</p>
          <Link to="/forgot-password" style={{ color: 'var(--color-brand)', fontWeight: 500 }}>Request a new one</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.newPassword.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-brand)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M4 20C4 20 6 12 13 12C20 12 22 20 22 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="13" cy="8" r="3.5" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Set new password</h1>
        </div>

        <div className="card">
          {success ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Password reset!</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Redirecting you to sign in...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">New password</label>
                <input className="form-input" type="password" required placeholder="Min. 8 characters"
                  value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input className="form-input" type="password" required placeholder="Same as above"
                  value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8 }}
                disabled={loading}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
