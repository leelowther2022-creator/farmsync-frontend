import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ farmName: '', slug: '', fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return e => {
      const val = e.target.value;
      setForm(f => {
        const update = { ...f, [field]: val };
        if (field === 'farmName') {
          update.slug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
        return update;
      });
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-brand)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M4 20C4 20 6 12 13 12C20 12 22 20 22 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="13" cy="8" r="3.5" stroke="white" strokeWidth="2"/>
              <path d="M8 24H18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Set up your farm</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Create your management account</p>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Farm name</label>
              <input className="form-input" required placeholder="e.g. Smith Farm Ltd"
                value={form.farmName} onChange={set('farmName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Farm URL</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--border-strong)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <span style={{ padding: '9px 10px', background: 'var(--bg-secondary)', fontSize: 13, color: 'var(--text-muted)', borderRight: '0.5px solid var(--border)', whiteSpace: 'nowrap' }}>farmsync.app/</span>
                <input style={{ flex: 1, padding: '9px 10px', border: 'none', outline: 'none', fontSize: 14, fontFamily: 'var(--font)', background: 'transparent' }}
                  required placeholder="smith-farm"
                  value={form.slug} onChange={set('slug')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input className="form-input" required placeholder="James Fletcher"
                value={form.fullName} onChange={set('fullName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" required placeholder="you@example.com"
                value={form.email} onChange={set('email')} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required placeholder="Min. 8 characters"
                value={form.password} onChange={set('password')} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', marginTop: 8 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: '1rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-brand)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
