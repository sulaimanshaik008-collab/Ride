import { apiFetch } from './api';

export const organizationService = {
  getCurrentOrganization: async () => {
    const res = await apiFetch('/organizations/current');
    return res.data;
  },

  updateCurrentOrganization: async (data) => {
    const res = await apiFetch('/organizations/current', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  getOrganizationUsers: async ({ role = '', status = '', search = '', page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('size', size);

    const res = await apiFetch(`/organizations/current/users?${params.toString()}`);
    return res.data;
  },

  getUserById: async (userId) => {
    const res = await apiFetch(`/organizations/current/users/${userId}`);
    return res.data;
  },

  createUser: async (userData) => {
    const res = await apiFetch('/organizations/current/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.data;
  },

  updateUserRole: async (userId, role) => {
    const res = await apiFetch(`/organizations/current/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.data;
  },

  updateUserStatus: async (userId, status) => {
    const res = await apiFetch(`/organizations/current/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  getOrganizationSummary: async () => {
    const res = await apiFetch('/organizations/current/summary');
    return res.data;
  },
};
