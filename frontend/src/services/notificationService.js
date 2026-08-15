import { apiFetch } from './api';

export const notificationService = {
  getUserNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.size !== undefined) queryParams.append('size', params.size);
    if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly);

    const queryString = queryParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

    const response = await apiFetch(endpoint, {
      method: 'GET',
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiFetch('/notifications/unread-count', {
      method: 'GET',
    });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await apiFetch(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiFetch('/notifications/read-all', {
      method: 'PATCH',
    });
    return response.data;
  },
};
