import { apiFetch } from './api';

const LOCAL_STORAGE_KEY_PREFIX = 'corp_saved_riders_';

const getStorageKey = (userId) => `${LOCAL_STORAGE_KEY_PREFIX}${userId || 'guest'}`;

export const riderService = {
  getSavedRiders: async (userId) => {
    // 1. Try to fetch from backend API
    try {
      const response = await apiFetch('/riders', {
        method: 'GET',
      });
      if (response && response.data) {
        // Cache to local storage
        if (userId) {
          localStorage.setItem(getStorageKey(userId), JSON.stringify(response.data));
        }
        return response.data;
      }
    } catch (err) {
      console.warn('Backend /riders endpoint unavailable, falling back to local storage:', err.message);
    }

    // 2. Fallback to localStorage cache
    try {
      const cached = localStorage.getItem(getStorageKey(userId));
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error reading saved riders from localStorage:', e);
    }

    return [];
  },

  createSavedRider: async (riderData, userId) => {
    let savedRider = null;
    try {
      const response = await apiFetch('/riders', {
        method: 'POST',
        body: JSON.stringify(riderData),
      });
      savedRider = response.data;
    } catch (err) {
      console.warn('Backend /riders create failed, generating local saved rider entry:', err.message);
      const fullName = `${riderData.firstName || ''} ${riderData.lastName || ''}`.trim();
      const initials = (
        (riderData.firstName?.[0] || '') + (riderData.lastName?.[0] || '')
      ).toUpperCase() || 'R';

      savedRider = {
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        firstName: riderData.firstName,
        lastName: riderData.lastName,
        fullName,
        phoneNumber: riderData.phoneNumber,
        countryCode: riderData.countryCode || '+1',
        initials,
        createdAt: new Date().toISOString(),
      };
    }

    // Update localStorage cache
    try {
      const key = getStorageKey(userId);
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [savedRider, ...existing.filter((r) => r.id !== savedRider.id)];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Error updating localStorage saved riders:', e);
    }

    return savedRider;
  },

  deleteSavedRider: async (id, userId) => {
    try {
      await apiFetch(`/riders/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Backend /riders delete failed:', err.message);
    }

    // Remove from localStorage
    try {
      const key = getStorageKey(userId);
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = existing.filter((r) => r.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting from localStorage:', e);
    }
  },
};
