import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [devLink, setDevLink] = useState('');
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await api.post('/auth/forgot-password', { email });
      setSent(true);
      // Dev mode only — shows the reset link directly
      if (data._devResetLink) setDevLink(data._devResetLink);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
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
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Reset your password</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Enter your email and we'll send a reset link</p>
        </div>

        <div className="card">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✉</div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Check your email</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                If an account exists for <strong>{email}</strong>, a reset link has been sent.
              </p>
              {devLink && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.75rem', marginBottom: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dev mode — reset link</div>
                  <a href={devLink} style={{ fontSize: 12, color: 'var(--color-brand)', wordBreak: 'break-all' }}>{devLink}</a>
                </div>
              )}
              <Link to="/login" style={{ color: 'var(--color-brand)', fontSize: 14, fontWeight: 500 }}>Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="form-input" type="email" required placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8 }}
                disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: '1rem' }}>
            Remember your password? <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 500 }}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
