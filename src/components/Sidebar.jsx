import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NAV = [
  { to: '/',          label: 'Dashboard', icon: '▦' },
  { to: '/expenses',  label: 'Expenses',  icon: '↓' },
  { to: '/income',    label: 'Income',    icon: '↑' },
  { to: '/employees', label: 'Employees', icon: '♟' },
  { to: '/equipment', label: 'Equipment', icon: '⚙' },
  { to: '/export',    label: 'Export',    icon: '⇩' },
  { to: '/settings',  label: 'Settings',  icon: '◎' },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-w)', background: '#fff',
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 50,
    }}>
      {/* Brand */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '0.5px solid var(--border)' }}>
        {tenant?.logoUrl
          ? <img src={tenant.logoUrl} alt={tenant.name} style={{ height: 32, objectFit: 'contain', maxWidth: '100%' }} />
          : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                {tenant?.name?.[0] ?? 'F'}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{tenant?.name ?? 'FarmSync'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tenant?.plan ?? 'starter'} plan</div>
              </div>
            </div>
          )
        }
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 'var(--radius-md)',
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-brand)' : 'var(--text-secondary)',
              background: isActive ? 'var(--color-brand-light)' : 'transparent',
              textDecoration: 'none', marginBottom: 2, transition: 'all 0.12s',
            })}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{user?.fullName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{user?.role}</div>
        <button onClick={handleLogout} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Sign out</button>
      </div>
    </aside>
  );
}
