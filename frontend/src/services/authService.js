import { apiFetch } from './api';

export const authService = {
  getCurrentUser: async () => {
    const response = await apiFetch('/auth/me', {
      method: 'GET',
    });
    return response.data;
  },

  getDemoUsers: async () => {
    const response = await apiFetch('/auth/demo-users', {
      method: 'GET',
    });
    return response.data;
  },

  loginAsEmail: async (email) => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response.data;
  },
};
