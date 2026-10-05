import client from './client';
export const vehicleApi = {
  list: () => client.get('/vehicles'),
  get: (id) => client.get(`/vehicles/${id}`),
  create: (payload) => client.post('/vehicles', payload),
  update: (id, payload) => client.put(`/vehicles/${id}`, payload),
  remove: (id) => client.delete(`/vehicles/${id}`),
};
