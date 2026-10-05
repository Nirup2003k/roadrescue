import client from './client';
export const serviceApi = {
  list: (all = false) => client.get('/services', { params: all ? { all: true } : {} }),
  get: (id) => client.get(`/services/${id}`),
  create: (payload) => client.post('/services', payload),
  update: (id, payload) => client.put(`/services/${id}`, payload),
};
