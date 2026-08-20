import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { setCurrentUserEmailHeader } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('rideflow_theme') || 'dark';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rideflow_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      const usersList = await authService.getDemoUsers();
      setDemoUsers(usersList || []);
    } catch (err) {
      console.error('Failed to load auth user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const login = async (email, password, role) => {
    setCurrentUserEmailHeader(email);
    const user = await authService.loginAsEmail(email, password, role);
    setCurrentUser(user);
    return user;
  };

  const signup = async (formData) => {
    setCurrentUserEmailHeader(formData.email);
    const user = await authService.signUp(formData);
    setCurrentUser(user);
    return user;
  };

  const loginWithGoogle = async () => {
    const user = await authService.loginWithGoogle();
    if (user?.email) {
      setCurrentUserEmailHeader(user.email);
    }
    setCurrentUser(user);
    return user;
  };

  const loginAsGuest = async () => {
    const guestUser = await authService.loginAsGuest();
    setCurrentUser(guestUser);
    return guestUser;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentUserEmailHeader('');
  };

  const switchDemoUser = async (email) => {
    try {
      setLoading(true);
      setCurrentUserEmailHeader(email);
      const user = await authService.loginAsEmail(email);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Failed to switch demo user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        demoUsers,
        loading,
        theme,
        toggleTheme,
        login,
        signup,
        logout,
        loginWithGoogle,
        loginAsGuest,
        switchDemoUser,
        refreshUser: fetchUserData,
        isGuest: Boolean(currentUser?.isGuest),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
