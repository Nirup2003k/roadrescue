import client from './client';
export const userApi = {
  getProfile: () => client.get('/users/profile'),
  updateProfile: (payload) => client.put('/users/profile', payload),
  changePassword: (payload) => client.put('/users/change-password', payload),
};
