import client from './client';
export const reviewApi = {
  create: (payload) => client.post('/reviews', payload),
  byMechanic: (mechanicId) => client.get(`/reviews/mechanic/${mechanicId}`),
  my: () => client.get('/reviews/my'),
  received: () => client.get('/reviews/mine-as-mechanic'),
};
