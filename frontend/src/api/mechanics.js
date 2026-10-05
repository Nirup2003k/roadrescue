import client from './client';
export const mechanicApi = {
  list: (params = {}) => client.get('/mechanics', { params }),
  nearby: (params) => client.get('/mechanics/nearby', { params }),
  get: (id) => client.get(`/mechanics/${id}`),
  updateAvailability: (availabilityStatus) => client.put('/mechanics/availability', { availabilityStatus }),
  updateServices: (serviceIds) => client.put('/mechanics/services', { serviceIds }),
  earnings: () => client.get('/mechanics/earnings'),
};
