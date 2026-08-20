import { apiFetch } from './api';

export const rideService = {
  createRide: async (rideData) => {
    const response = await apiFetch('/rides', {
      method: 'POST',
      body: JSON.stringify(rideData),
    });
    return response.data;
  },

  getEmployeeRides: async () => {
    const response = await apiFetch('/rides', {
      method: 'GET',
    });
    return response.data;
  },

  getRideById: async (id) => {
    const response = await apiFetch(`/rides/${id}`, {
      method: 'GET',
    });
    return response.data;
  },

  cancelRide: async (id, cancellationReason) => {
    const response = await apiFetch(`/rides/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason }),
    });
    return response.data;
  },

  // Feature 4 — Ride Scheduling & Manager Request Management API Methods
  getSchedulableRides: async () => {
    const response = await apiFetch('/rides/schedulable', {
      method: 'GET',
    });
    return response.data;
  },

  approveRide: async (id) => {
    const response = await apiFetch(`/rides/${id}/approve`, {
      method: 'POST',
    });
    return response.data;
  },

  rejectRideRequest: async (id, reason, notes = '') => {
    const response = await apiFetch(`/rides/${id}/reject-request`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
    return response.data;
  },

  scheduleRide: async (id, scheduleData) => {
    const response = await apiFetch(`/rides/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
    return response.data;
  },

  rescheduleRide: async (id, rescheduleData) => {
    const response = await apiFetch(`/rides/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(rescheduleData),
    });
    return response.data;
  },

  getScheduledRides: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.bookingDate) queryParams.append('bookingDate', params.bookingDate);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/rides/scheduled${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },

  // Feature 5 — Driver & Vehicle Assignment API Methods
  getPendingAssignmentRides: async () => {
    const response = await apiFetch('/rides/assignment-pending', {
      method: 'GET',
    });
    return response.data;
  },

  getAssignmentOptions: async (id) => {
    const response = await apiFetch(`/rides/${id}/assignment-options`, {
      method: 'GET',
    });
    return response.data;
  },

  assignRideResources: async (id, assignmentData) => {
    const response = await apiFetch(`/rides/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    return response.data;
  },

  assignDriverAndVehicle: async (id, assignmentData) => {
    const response = await apiFetch(`/rides/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(assignmentData),
    });
    return response.data;
  },

  replaceRideAssignment: async (id, assignmentData) => {
    const response = await apiFetch(`/rides/${id}/assignment`, {
      method: 'PATCH',
      body: JSON.stringify(assignmentData),
    });
    return response.data;
  },

  unassignRideResources: async (id) => {
    const response = await apiFetch(`/rides/${id}/assignment`, {
      method: 'DELETE',
    });
    return response.data;
  },

  unassignRide: async (id) => {
    const response = await apiFetch(`/rides/${id}/assignment`, {
      method: 'DELETE',
    });
    return response.data;
  },

  // Feature 6 — Real-Time Tracking & Monitoring API Methods
  startTrip: async (id) => {
    const response = await apiFetch(`/rides/${id}/start`, {
      method: 'POST',
    });
    return response.data;
  },

  updateLocation: async (id, locationData) => {
    const response = await apiFetch(`/rides/${id}/location`, {
      method: 'POST',
      body: JSON.stringify(locationData),
    });
    return response.data;
  },

  getLatestLocation: async (id) => {
    const response = await apiFetch(`/rides/${id}/location`, {
      method: 'GET',
    });
    return response.data;
  },

  getLocationHistory: async (id) => {
    const response = await apiFetch(`/rides/${id}/location/history`, {
      method: 'GET',
    });
    return response.data;
  },

  completeTrip: async (id) => {
    const response = await apiFetch(`/rides/${id}/complete`, {
      method: 'POST',
    });
    return response.data;
  },

  getActiveTrips: async () => {
    const response = await apiFetch('/rides/active', {
      method: 'GET',
    });
    return response.data;
  },

  getDriverAssignedTrips: async () => {
    const response = await apiFetch('/rides/driver-assigned', {
      method: 'GET',
    });
    return response.data;
  },

  // Feature 7 — Driver Operations API Methods
  acceptRide: async (id) => {
    const response = await apiFetch(`/rides/${id}/accept`, {
      method: 'POST',
    });
    return response.data;
  },

  rejectRide: async (id, reason, notes = '') => {
    const response = await apiFetch(`/rides/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
    return response.data;
  },

  verifyEmployee: async (id, employeeIdentifier, verificationMethod = 'BADGE_OR_EMAIL') => {
    const response = await apiFetch(`/rides/${id}/verify-employee`, {
      method: 'POST',
      body: JSON.stringify({ employeeIdentifier, verificationMethod }),
    });
    return response.data;
  },

  getDriverTodayRides: async () => {
    const response = await apiFetch('/rides/driver/today', {
      method: 'GET',
    });
    return response.data;
  },

  getDriverHistory: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/rides/driver/history${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },
};
