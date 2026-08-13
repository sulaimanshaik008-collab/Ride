import { apiFetch } from './api';

export const vehicleService = {
  createVehicle: async (vehicleData) => {
    const response = await apiFetch('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
    return response.data;
  },

  getVehicles: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.vehicleType && params.vehicleType !== 'ALL') queryParams.append('vehicleType', params.vehicleType);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
    if (params.availability && params.availability !== 'ALL') queryParams.append('availability', params.availability);
    if (params.maintenance && params.maintenance !== 'ALL') queryParams.append('maintenance', params.maintenance);

    const queryString = queryParams.toString();
    const endpoint = `/vehicles${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },

  getVehicleById: async (id) => {
    const response = await apiFetch(`/vehicles/${id}`, {
      method: 'GET',
    });
    return response.data;
  },

  updateVehicle: async (id, vehicleData) => {
    const response = await apiFetch(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
    return response.data;
  },

  updateVehicleStatus: async (id, statusData) => {
    const response = await apiFetch(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
    return response.data;
  },

  updateVehicleAvailability: async (id, availabilityData) => {
    const response = await apiFetch(`/vehicles/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify(availabilityData),
    });
    return response.data;
  },

  updateVehicleMaintenance: async (id, maintenanceData) => {
    const response = await apiFetch(`/vehicles/${id}/maintenance`, {
      method: 'PATCH',
      body: JSON.stringify(maintenanceData),
    });
    return response.data;
  },
};
