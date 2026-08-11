import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { setCurrentUserEmailHeader } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      const usersList = await authService.getDemoUsers();
      setDemoUsers(usersList);
    } catch (err) {
      console.error('Failed to load auth user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const switchDemoUser = async (email) => {
    try {
      setLoading(true);
      setCurrentUserEmailHeader(email);
      const user = await authService.loginAsEmail(email);
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to switch demo user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, demoUsers, loading, switchDemoUser, refreshUser: fetchUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
