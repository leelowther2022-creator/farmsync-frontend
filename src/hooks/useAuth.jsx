import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fs_token');
    if (token) {
      api.get('/auth/me')
        .then(({ user, tenant }) => { setUser(user); setTenant(tenant); })
        .catch(() => localStorage.removeItem('fs_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Apply tenant primary color as CSS variable
  useEffect(() => {
    if (tenant?.primaryColor) {
      document.documentElement.style.setProperty('--color-brand', tenant.primaryColor);
    }
  }, [tenant]);

  async function login(email, password, slug) {
    const data = await api.post('/auth/login', { email, password, slug });
    localStorage.setItem('fs_token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }

  async function register(payload) {
    const data = await api.post('/auth/register', payload);
    localStorage.setItem('fs_token', data.token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }

  function logout() {
    localStorage.removeItem('fs_token');
    setUser(null);
    setTenant(null);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
