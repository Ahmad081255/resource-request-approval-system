import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rram_user');
    const token = localStorage.getItem('rram_token');
    if (!token || !stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const token = localStorage.getItem('rram_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('rram_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          localStorage.removeItem('rram_token');
          localStorage.removeItem('rram_user');
          setUser(null);
        })
        .finally(() => {
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  async function login(username, password) {
    const data = await api.post('/auth/login', { username, password });
    localStorage.setItem('rram_token', data.token);
    localStorage.setItem('rram_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('rram_token');
    localStorage.removeItem('rram_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, initializing }}>
      {!initializing ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
