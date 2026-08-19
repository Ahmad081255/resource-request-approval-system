import { createContext, useContext, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('rram_user');
    return stored ? JSON.parse(stored) : null;
  });

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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
