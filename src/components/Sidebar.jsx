import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/',          label: 'Dashboard', icon: '▦' },
  { to: '/tasks',     label: 'Tasks',     icon: '✓' },
  { to: '/expenses',  label: 'Expenses',  icon: '↓' },
  { to: '/income',    label: 'Income',    icon: '↑' },
  { to: '/employees', label: 'Employees', icon: '♟' },
  { to: '/equipment', label: 'Equipment', icon: '⚙' },
  { to: '/export',    label: 'Export',    icon: '⬇' },
  { to: '/settings',  label: 'Settings',  icon: '◎' },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside style={{
      width: 168,
      minHeight: '100vh',
      background: '#fff',
      borderRight: '0.5px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 40,
    }}>
      {/* Header */}
      <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '0.5px solid var(--border)' }}>
        {tenant?.logoUrl
          ? <img src={tenant.logoUrl} alt={tenant.name} style={{ height: 28, maxWidth: 130, objectFit: 'contain' }} />
          : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {tenant?.name?.[0] || 'F'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{tenant?.name || 'FarmSync'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize', fontWeight: 400 }}>{tenant?.plan || 'Starter'} Plan</div>
              </div>
            </div>
          )
        }
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0', overflowY: 'auto' }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-brand)' : 'var(--text-secondary)',
              background: isActive ? 'var(--color-brand-light, #f0faf6)' : 'transparent',
              borderRight: isActive ? '3px solid var(--color-brand)' : '3px solid transparent',
              textDecoration: 'none',
              transition: 'background 0.15s',
            })}>
            <span style={{ fontSize: 15, width: 18, textAlign: 'center', opacity: 0.8 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{user?.role}</div>
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '6px', borderRadius: 6, border: '0.5px solid var(--border)', background: 'transparent', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
