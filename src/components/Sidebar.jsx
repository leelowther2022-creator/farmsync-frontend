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
    <aside className="sidebar">
      <div className="sidebar-header">
        {tenant?.logoUrl
          ? <img src={tenant.logoUrl} alt={tenant.name} style={{ height: 32, maxWidth: 140, objectFit: 'contain' }} />
          : <div className="sidebar-logo">{tenant?.name || 'FarmSync'}</div>
        }
        {tenant && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
            {tenant.plan || 'Starter'} Plan
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.fullName}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
        <button className="btn btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
