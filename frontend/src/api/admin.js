import client from './client';
export const adminApi = {
  stats: () => client.get('/admin/stats'),
  customers: (params = {}) => client.get('/admin/customers', { params }),
  suspendCustomer: (id) => client.put(`/admin/customers/${id}/suspend`),
  activateCustomer: (id) => client.put(`/admin/customers/${id}/activate`),
  mechanics: (params = {}) => client.get('/admin/mechanics', { params }),
  approveMechanic: (id) => client.put(`/admin/mechanics/${id}/approve`),
  suspendMechanic: (id) => client.put(`/admin/mechanics/${id}/suspend`),
  activateMechanic: (id) => client.put(`/admin/mechanics/${id}/activate`),
  bookings: (params = {}) => client.get('/admin/bookings', { params }),
  reviews: () => client.get('/admin/reviews'),
  deleteReview: (id) => client.delete(`/admin/reviews/${id}`),
};
