import client from './client';
export const bookingApi = {
  create: (payload) => client.post('/bookings', payload),
  list: (params = {}) => client.get('/bookings', { params }),
  get: (id) => client.get(`/bookings/${id}`),
  accept: (id) => client.put(`/bookings/${id}/accept`),
  reject: (id) => client.put(`/bookings/${id}/reject`),
  advanceStatus: (id, status) => client.put(`/bookings/${id}/status`, { status }),
  cancel: (id, reason) => client.put(`/bookings/${id}/cancel`, { reason }),
};
