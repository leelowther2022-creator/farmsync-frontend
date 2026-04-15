import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar          from './components/Sidebar';
import Login            from './pages/Login';
import Register         from './pages/Register';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import Dashboard        from './pages/Dashboard';
import Expenses         from './pages/Expenses';
import Income           from './pages/Income';
import Employees        from './pages/Employees';
import Equipment        from './pages/Equipment';
import Export           from './pages/Export';
import Settings         from './pages/Settings';
import Tasks            from './pages/Tasks';
import EmployeePortal   from './pages/EmployeePortal';

function MobileNav() {
  const NAV = [
    { to: '/',          icon: '▦', label: 'Home'      },
    { to: '/tasks',     icon: '✓', label: 'Tasks'     },
    { to: '/expenses',  icon: '↓', label: 'Expenses'  },
    { to: '/income',    icon: '↑', label: 'Income'    },
    { to: '/employees', icon: '♟', label: 'Staff'     },
  ];
  return (
    <nav style={{
      display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '0.5px solid var(--border)', zIndex: 50,
      padding: '4px 0 env(safe-area-inset-bottom)'
    }} className="mobile-nav">
      {NAV.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '6px 0', flex: 1,
          color: isActive ? 'var(--color-brand)' : 'var(--text-muted)',
          textDecoration: 'none', fontSize: 10, fontWeight: 500,
        })}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function PrivateLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
      <MobileNav />
    </div>
  );
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user)    return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"           element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register"        element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />
          <Route path="/reset-password"  element={<PublicOnly><ResetPassword /></PublicOnly>} />

          {/* Employee portal — completely separate, no farmer auth needed */}
          <Route path="/staff"           element={<EmployeePortal />} />

          {/* Farmer app */}
          <Route path="/"          element={<PrivateLayout><Dashboard /></PrivateLayout>} />
          <Route path="/tasks"     element={<PrivateLayout><Tasks /></PrivateLayout>} />
          <Route path="/expenses"  element={<PrivateLayout><Expenses /></PrivateLayout>} />
          <Route path="/income"    element={<PrivateLayout><Income /></PrivateLayout>} />
          <Route path="/employees" element={<PrivateLayout><Employees /></PrivateLayout>} />
          <Route path="/equipment" element={<PrivateLayout><Equipment /></PrivateLayout>} />
          <Route path="/export"    element={<PrivateLayout><Export /></PrivateLayout>} />
          <Route path="/settings"  element={<PrivateLayout><Settings /></PrivateLayout>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
