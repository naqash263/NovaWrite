import { useState, useEffect } from 'react';
import apiClient from '../api/axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await apiClient.post('/auth/login', { 
      email, 
      password, 
      remember_me: rememberMe 
    });
    const { token: newToken, user: userData } = response.data;
    
    // Store token in localStorage (persists across browser sessions)
    localStorage.setItem('token', newToken);
    setTokenState(newToken);
    setUser(userData);
    setLoading(false);
    return response.data;
  };

  const logout = (redirectTo?: string) => {
    localStorage.removeItem('token');
    setTokenState(null);
    setUser(null);
    
    // Redirect after logout
    if (redirectTo) {
      window.location.href = redirectTo;
    }
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
