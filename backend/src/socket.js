const { Server } = require('socket.io');
const { verifyToken } = require('./utils/jwt');
const { query } = require('./db/query');
const { haversineDistanceKm, estimateEtaMinutes } = require('./utils/geo');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // JWT Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      const decoded = verifyToken(token);
      if (!decoded || !decoded.id) {
        return next(new Error('Authentication error: Invalid token'));
      }
      
      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };
      next();
    } catch (err) {
      next(new Error('Authentication error: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] User connected: ${socket.user.id} (${socket.user.role}) [socketId: ${socket.id}]`);

    // Join Booking Tracking Room
    socket.on('join_booking_room', async ({ bookingId }, callback) => {
      try {
        const id = parseInt(bookingId, 10);
        if (isNaN(id)) {
          if (typeof callback === 'function') callback({ success: false, message: 'Invalid booking ID' });
          return;
        }

        const rows = await query('SELECT id, customer_id, mechanic_id, status, latitude, longitude FROM bookings WHERE id = ?', [id]);
        if (rows.length === 0) {
          if (typeof callback === 'function') callback({ success: false, message: 'Booking not found' });
          return;
        }

        const booking = rows[0];

        // Authorization checks
        const isCustomer = socket.user.role === 'customer' && booking.customer_id === socket.user.id;
        const isMechanic = socket.user.role === 'mechanic' && booking.mechanic_id === socket.user.id;
        const isAdmin = socket.user.role === 'admin';

        if (!isCustomer && !isMechanic && !isAdmin) {
          if (typeof callback === 'function') callback({ success: false, message: 'Unauthorized to track this booking' });
          return;
        }

        const roomName = `booking:${id}`;
        socket.join(roomName);
        console.log(`[socket] User ${socket.user.id} (${socket.user.role}) joined ${roomName}`);

        if (typeof callback === 'function') callback({ 
          success: true, 
          message: `Joined ${roomName}`, 
          bookingStatus: booking.status 
        });
      } catch (err) {
        console.error('[socket] Error joining booking room:', err);
        if (typeof callback === 'function') callback({ success: false, message: 'Server error joining tracking room' });
      }
    });

    // Leave Booking Tracking Room
    socket.on('leave_booking_room', ({ bookingId }) => {
      const id = parseInt(bookingId, 10);
      if (!isNaN(id)) {
        const roomName = `booking:${id}`;
        socket.leave(roomName);
        console.log(`[socket] User ${socket.user.id} left ${roomName}`);
      }
    });

    // Location Update from Mechanic
    socket.on('location_update', async (data) => {
      try {
        const { bookingId, latitude, longitude, accuracy } = data || {};
        const id = parseInt(bookingId, 10);
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (isNaN(id) || isNaN(lat) || isNaN(lng)) return;
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

        // Strict authorization: only the mechanic assigned to this booking can send location updates
        if (socket.user.role !== 'mechanic') return;

        const rows = await query(
          'SELECT id, customer_id, mechanic_id, status, latitude AS cust_lat, longitude AS cust_lng FROM bookings WHERE id = ?', 
          [id]
        );
        if (rows.length === 0) return;

        const booking = rows[0];
        if (booking.mechanic_id !== socket.user.id) return;
        if (!['accepted', 'in_progress'].includes(booking.status)) return;

        // Compute live distance & ETA if customer coordinates exist
        let distanceKm = null;
        let etaMinutes = null;
        if (booking.cust_lat !== null && booking.cust_lng !== null) {
          distanceKm = Math.round(haversineDistanceKm(lat, lng, booking.cust_lat, booking.cust_lng) * 10) / 10;
          etaMinutes = estimateEtaMinutes(distanceKm);
        }

        const payload = {
          bookingId: id,
          mechanicId: socket.user.id,
          latitude: lat,
          longitude: lng,
          accuracy: accuracy || null,
          distanceKm,
          etaMinutes,
          timestamp: new Date().toISOString(),
        };

        // Broadcast to the specific booking tracking room
        io.to(`booking:${id}`).emit('mechanic_location', payload);

        // Update mechanic latest location in DB asynchronously
        query('UPDATE mechanics SET latitude = ?, longitude = ? WHERE user_id = ?', [lat, lng, socket.user.id]).catch(() => {});
      } catch (err) {
        console.error('[socket] Error in location_update:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] User disconnected: ${socket.user.id} [socketId: ${socket.id}]`);
    });
  });

  return io;
}

function getIo() {
  return io;
}

function notifyBookingStatusChange(bookingId, status) {
  if (io) {
    io.to(`booking:${bookingId}`).emit('booking_status_changed', { bookingId, status });
  }
}

module.exports = { initSocket, getIo, notifyBookingStatusChange };
