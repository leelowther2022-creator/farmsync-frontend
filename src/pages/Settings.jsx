import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function Settings() {
  const { tenant, user } = useAuth();
  const [brandForm, setBrandForm] = useState({ name: '', primary_color: '#1D9E75', logo_url: '' });
  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]       = useState(false);
  const [savingPw, setSavingPw]   = useState(false);
  const [msg, setMsg]             = useState('');
  const [pwMsg, setPwMsg]         = useState('');
  const [error, setError]         = useState('');
  const [pwError, setPwError]     = useState('');
  const [users, setUsers]         = useState([]);
  const [billing, setBilling]     = useState(null);
  const [plans, setPlans]         = useState({});
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    if (tenant) setBrandForm({ name: tenant.name || '', primary_color: tenant.primaryColor || '#1D9E75', logo_url: tenant.logoUrl || '' });
    api.get('/tenant/users').then(setUsers).catch(() => {});
    api.get('/billing/status').then(setBilling).catch(() => {});
    api.get('/billing/plans').then(setPlans).catch(() => {});
    if (window.location.search.includes('billing=success')) {
      setMsg('Subscription activated — thank you!');
      window.history.replaceState({}, '', '/settings');
    }
  }, [tenant]);

  async function handleSaveBrand(e) {
    e.preventDefault(); setSaving(true); setMsg(''); setError('');
    try {
      await api.put('/tenant', brandForm);
      document.documentElement.style.setProperty('--color-brand', brandForm.primary_color);
      setMsg('Branding saved successfully.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleChangePassword(e) {
    e.preventDefault(); setPwError(''); setPwMsg('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return setPwError('New passwords do not match');
    }
    if (pwForm.newPassword.length < 8) {
      return setPwError('New password must be at least 8 characters');
    }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { setPwError(err.message); }
    finally { setSavingPw(false); }
  }

  async function handleUpgrade(plan) {
    setBillingLoading(true); setError('');
    try {
      const { url } = await api.post('/billing/checkout', { plan });
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Billing not configured yet.');
      setBillingLoading(false);
    }
  }

  async function handlePortal() {
    setBillingLoading(true);
    try {
      const { url } = await api.post('/billing/portal');
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBillingLoading(false);
    }
  }

  const PRESETS = ['#1D9E75','#378ADD','#7F77DD','#D85A30','#D4537E','#639922','#BA7517','#2C2C2A'];
  const currentPlan = billing?.plan || 'starter';
  const isOwner = user?.role === 'owner';

  return (
    <div>
      <div className="page-header"><div className="page-title">Settings</div></div>

      {msg   && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}
      {error && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Branding */}
          <div className="card">
            <div className="card-title">Branding</div>
            <form onSubmit={handleSaveBrand}>
              <div className="form-group">
                <label className="form-label">Farm / business name</label>
                <input className="form-input" value={brandForm.name}
                  onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input className="form-input" placeholder="https://..." value={brandForm.logo_url}
                  onChange={e => setBrandForm(f => ({ ...f, logo_url: e.target.value }))} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Hosted image link — shown in the sidebar.</div>
              </div>
              <div className="form-group">
                <label className="form-label">Brand colour</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {PRESETS.map(c => (
                    <button key={c} type="button" onClick={() => setBrandForm(f => ({ ...f, primary_color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: brandForm.primary_color === c ? '3px solid var(--text-primary)' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={brandForm.primary_color}
                    onChange={e => setBrandForm(f => ({ ...f, primary_color: e.target.value }))}
                    style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }} />
                  <input className="form-input" value={brandForm.primary_color}
                    onChange={e => setBrandForm(f => ({ ...f, primary_color: e.target.value }))}
                    style={{ width: 110, fontFamily: 'monospace' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: brandForm.primary_color }} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save branding'}</button>
            </form>
          </div>

          {/* Change password */}
          <div className="card">
            <div className="card-title">Change password</div>
            {pwMsg   && <div className="alert alert-success">{pwMsg}</div>}
            {pwError && <div className="alert alert-error">{pwError}</div>}
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current password</label>
                <input className="form-input" type="password" required placeholder="••••••••"
                  value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">New password</label>
                <input className="form-input" type="password" required placeholder="Min. 8 characters"
                  value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new password</label>
                <input className="form-input" type="password" required placeholder="Same as above"
                  value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPw}>{savingPw ? 'Updating...' : 'Update password'}</button>
            </form>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Account */}
          <div className="card">
            <div className="card-title">Account</div>
            <div style={{ fontSize: 14 }}>
              {[['Name', user?.fullName, false, false], ['Email', user?.email, false, false], ['Role', user?.role, true, false], ['Farm URL', tenant?.slug, false, true]].map(([label, val, badge, mono]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  {badge ? <span className="badge badge-green">{val}</span>
                         : <span style={{ fontWeight: 500, fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? 12 : undefined }}>{val}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Billing */}
          {isOwner && (
            <div className="card">
              <div className="card-title">Plan & billing</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{currentPlan} plan</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {billing?.subscriptionStatus ? `Status: ${billing.subscriptionStatus}` : 'No active subscription'}
                  </div>
                </div>
                <span className={`badge ${currentPlan === 'pro' ? 'badge-green' : 'badge-gray'}`}>
                  {currentPlan === 'pro' ? 'Pro' : 'Starter'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '1rem' }}>
                {Object.entries(plans).map(([key, plan]) => {
                  const active = currentPlan === key;
                  return (
                    <div key={key} style={{ border: `${active ? 2 : 0.5}px solid ${active ? 'var(--color-brand)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: '0.85rem', background: active ? 'var(--color-brand-light)' : 'transparent' }}>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>{plan.name}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-brand)', marginBottom: 8 }}>
                        £{Math.round(plan.price / 100)}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>/mo</span>
                      </div>
                      {plan.features?.map(f => (
                        <div key={f} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 3, display: 'flex', gap: 5 }}>
                          <span style={{ color: 'var(--success)' }}>✓</span>{f}
                        </div>
                      ))}
                      {!active
                        ? <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => handleUpgrade(key)} disabled={billingLoading}>Upgrade</button>
                        : <div style={{ fontSize: 11, color: 'var(--color-brand)', fontWeight: 600, marginTop: 10 }}>✓ Current plan</div>
                      }
                    </div>
                  );
                })}
              </div>

              {billing?.subscriptionStatus && (
                <button className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePortal} disabled={billingLoading}>
                  {billingLoading ? 'Loading...' : 'Manage billing / cancel'}
                </button>
              )}
            </div>
          )}

          {/* Team */}
          <div className="card">
            <div className="card-title">Team members</div>
            {users.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No additional users yet.</p>
              : users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)', fontSize: 14 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span className="badge badge-gray">{u.role}</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
