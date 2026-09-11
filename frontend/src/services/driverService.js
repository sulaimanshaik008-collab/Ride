import { apiFetch } from './api';

export const driverService = {
  createDriver: async (driverData) => {
    const response = await apiFetch('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
    return response.data;
  },

  getDrivers: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params.availability && params.availability !== 'ALL') queryParams.append('availability', params.availability);

    const queryString = queryParams.toString();
    const endpoint = `/drivers${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },

  getDriverById: async (id) => {
    const response = await apiFetch(`/drivers/${id}`, {
      method: 'GET',
    });
    return response.data;
  },

  getSelfDriverProfile: async () => {
    const response = await apiFetch('/drivers/me', {
      method: 'GET',
    });
    return response.data;
  },

  updateDriver: async (id, driverData) => {
    const response = await apiFetch(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
    return response.data;
  },

  updateDriverStatus: async (id, statusData) => {
    const response = await apiFetch(`/drivers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
    return response.data;
  },

  updateDriverAvailability: async (id, availabilityData) => {
    const response = await apiFetch(`/drivers/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(availabilityData),
    });
    return response.data;
  },

  updateSelfDocuments: async (documentData) => {
    const response = await apiFetch('/drivers/self/documents', {
      method: 'PUT',
      body: JSON.stringify(documentData),
    });
    return response.data;
  },

  verifyDriver: async (id, verificationData) => {
    const response = await apiFetch(`/drivers/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
    return response.data;
  },

  getSelfMonthlyEarnings: async (month) => {
    const endpoint = `/drivers/self/earnings/monthly${month ? `?month=${month}` : ''}`;
    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },

  getMonthlyPayouts: async (month) => {
    const endpoint = `/drivers/payouts/monthly${month ? `?month=${month}` : ''}`;
    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },

  processDriverPayout: async (id, payoutData) => {
    const response = await apiFetch(`/drivers/${id}/payouts/pay`, {
      method: 'POST',
      body: JSON.stringify(payoutData),
    });
    return response.data;
  },
};
