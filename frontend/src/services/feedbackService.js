import { apiFetch } from './api';

export const feedbackService = {
  submitFeedback: async ({ rideId, rating, comments }) => {
    const res = await apiFetch('/feedback', {
      method: 'POST',
      body: JSON.stringify({ rideId, rating, comments }),
    });
    return res.data;
  },

  getMyFeedbackHistory: async () => {
    const res = await apiFetch('/feedback/my');
    return res.data;
  },

  getFeedbackById: async (id) => {
    const res = await apiFetch(`/feedback/${id}`);
    return res.data;
  },

  getOrganizationFeedback: async ({ rating = '', reviewStatus = '', driverId = '', vehicleId = '', search = '', page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams();
    if (rating) params.append('rating', rating);
    if (reviewStatus) params.append('reviewStatus', reviewStatus);
    if (driverId) params.append('driverId', driverId);
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('size', size);

    const res = await apiFetch(`/feedback?${params.toString()}`);
    return res.data;
  },

  getFeedbackSummary: async () => {
    const res = await apiFetch('/feedback/summary');
    return res.data;
  },

  getFeedbackIntelligence: async () => {
    const res = await apiFetch('/feedback/intelligence');
    return res.data;
  },

  updateReviewStatus: async (id, reviewStatus) => {
    const res = await apiFetch(`/feedback/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus }),
    });
    return res.data;
  },
};

