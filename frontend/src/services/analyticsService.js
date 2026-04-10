import axiosClient from './axiosClient';

const get = (path, params = {}) =>
  axiosClient.get(`/analytics${path}`, { params }).then(r => r.data);

export const fetchSummary    = (range) => get('/summary',    { range });
export const fetchTrends     = (range, bucket) => get('/trends', { range, bucket });
export const fetchZones      = (range) => get('/zones',      { range });
export const fetchCategories = (range) => get('/categories', { range });
export const fetchTiming     = (range) => get('/timing',     { range });
export const fetchUserStats  = (range) => get('/users',      { range });
export const fetchHealth     = ()      => get('/health');
