import { apiFetch } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const profileService = {
  getProfile: async () => {
    const response = await apiFetch('/profile', {
      method: 'GET',
    });
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const currentUserEmail = localStorage.getItem('user_email') || '';
    const url = `${API_BASE_URL}/profile/avatar`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-User-Email': currentUserEmail,
        'Authorization': `Bearer ${currentUserEmail}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to upload profile image');
    }
    return data.data;
  },

  removeAvatar: async () => {
    const response = await apiFetch('/profile/avatar', {
      method: 'DELETE',
    });
    return response.data;
  },
};
