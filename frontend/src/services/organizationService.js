import { apiFetch } from './api';

export const organizationService = {
  getCurrentOrganization: async () => {
    const res = await apiFetch('/api/v1/organizations/current');
    return res.data;
  },

  updateCurrentOrganization: async (data) => {
    const res = await apiFetch('/api/v1/organizations/current', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  getOrganizationUsers: async ({ role = '', status = '', search = '', page = 0, size = 20, sortBy = 'fullName', sortDirection = 'ASC' } = {}) => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('size', size);
    params.append('sortBy', sortBy);
    params.append('sortDirection', sortDirection);

    const res = await apiFetch(`/api/v1/organizations/current/users?${params.toString()}`);
    return res.data;
  },

  getOrganizationUserById: async (userId) => {
    const res = await apiFetch(`/api/v1/organizations/current/users/${userId}`);
    return res.data;
  },

  createOrganizationUser: async (userData) => {
    const res = await apiFetch('/api/v1/organizations/current/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return res.data;
  },

  updateUserRole: async (userId, role) => {
    const res = await apiFetch(`/api/v1/organizations/current/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.data;
  },

  updateUserStatus: async (userId, status) => {
    const res = await apiFetch(`/api/v1/organizations/current/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  getOrganizationSummary: async () => {
    const res = await apiFetch('/api/v1/organizations/current/summary');
    return res.data;
  },
};
