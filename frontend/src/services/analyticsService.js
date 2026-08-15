import { apiFetch } from './api';

export const analyticsService = {
  getOverview: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/overview${query}`);
    return res.data;
  },

  getRideTrends: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/rides${query}`);
    return res.data;
  },

  getDriverAnalytics: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/drivers${query}`);
    return res.data;
  },

  getVehicleAnalytics: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/vehicles${query}`);
    return res.data;
  },

  getRouteAnalytics: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/routes${query}`);
    return res.data;
  },

  getPeakHours: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/peak-hours${query}`);
    return res.data;
  },

  getCapacityAnalysis: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/capacity${query}`);
    return res.data;
  },

  getInsights: async (params = {}) => {
    const query = buildQueryString(params);
    const res = await apiFetch(`/analytics/insights${query}`);
    return res.data;
  },

  exportCsvUrl: (params = {}) => {
    const query = buildQueryString(params);
    return `/api/v1/analytics/export${query}`;
  },
};

const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  const str = queryParams.toString();
  return str ? `?${str}` : '';
};
