import axios from 'axios';
const client = axios.create({ baseURL: '/api', headers: { 'Content-Type': 'application/json' } });
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('rr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('rr_token');
      localStorage.removeItem('rr_user');
    }
    const message = data?.message || 'Something went wrong. Please try again.';
    const errors = data?.errors || null;
    return Promise.reject({ status, message, errors });
  }
);
export default client;
