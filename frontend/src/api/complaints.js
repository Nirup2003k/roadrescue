import client from './client';

export const complaintApi = {
  create: (data) => client.post('/complaints', data),
  listMy: () => client.get('/complaints/my'),
  getBookingComplaints: (bookingId) => client.get(`/complaints/booking/${bookingId}`),
};
