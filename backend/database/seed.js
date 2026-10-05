/**
 * RoadRescue demo data seeder.
 * Run with: npm run seed   (from the backend/ directory)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const { withTransaction } = require('../src/db/query');
const { haversineDistanceKm, estimateEtaMinutes } = require('../src/utils/geo');

const SALT_ROUNDS = 10;
const DEMO_PASSWORD = 'password123';
const ADMIN_PASSWORD = 'Admin@123';

async function hash(pw) {
  return bcrypt.hash(pw, SALT_ROUNDS);
}

async function main() {
  try {
    await withTransaction(async (conn) => {
      console.log('[seed] Clearing existing data...');
      await conn.query(
        `TRUNCATE TABLE users, customers, mechanics, services, mechanic_services,
                        vehicles, bookings, reviews RESTART IDENTITY CASCADE`
      );

      console.log('[seed] Creating admin...');
      const adminHash = await hash(ADMIN_PASSWORD);
      await conn.query(
        `INSERT INTO users (name, email, password_hash, phone, role, status)
         VALUES ('Admin User', 'admin@roadrescue.com', ?, '9000000001', 'admin', 'active')`,
        [adminHash]
      );

      console.log('[seed] Creating customers...');
      const customerDemoHash = await hash(DEMO_PASSWORD);
      const customerSeeds = [
        { name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '9000000011', address: '12 MG Road', city: 'Bengaluru' },
        { name: 'Priya Nair', email: 'priya.nair@example.com', phone: '9000000012', address: '45 Park Street', city: 'Mumbai' },
        { name: 'Amit Verma', email: 'amit.verma@example.com', phone: '9000000013', address: '78 Ring Road', city: 'Delhi' },
        { name: 'Sneha Reddy', email: 'sneha.reddy@example.com', phone: '9000000014', address: '23 Jubilee Hills', city: 'Hyderabad' },
      ];
      const customerIds = {};
      for (const c of customerSeeds) {
        const [user] = await conn.query(
          `INSERT INTO users (name, email, password_hash, phone, role, status)
           VALUES (?, ?, ?, ?, 'customer', 'active') RETURNING id`,
          [c.name, c.email, customerDemoHash, c.phone]
        );
        await conn.query(`INSERT INTO customers (user_id, address, city) VALUES (?, ?, ?)`, [user.id, c.address, c.city]);
        customerIds[c.email] = user.id;
      }

      console.log('[seed] Creating mechanics...');
      const mechanicSeeds = [
        {
          name: 'Suresh Kumar', email: 'suresh.kumar@example.com', phone: '9000000021',
          bio: 'Experienced roadside mechanic specializing in engines and batteries.',
          experienceYears: 8, serviceArea: 'Bengaluru', availability: 'available', approval: 'approved',
          latitude: 12.975800, longitude: 77.604500,
        },
        {
          name: 'Manoj Singh', email: 'manoj.singh@example.com', phone: '9000000022',
          bio: 'Fast, reliable tyre and towing specialist.',
          experienceYears: 5, serviceArea: 'Bengaluru', availability: 'available', approval: 'approved',
          latitude: 12.935200, longitude: 77.624500,
        },
        {
          name: 'Ravi Teja', email: 'ravi.teja@example.com', phone: '9000000023',
          bio: 'Battery and general breakdown expert with a fully equipped van.',
          experienceYears: 6, serviceArea: 'Bengaluru', availability: 'busy', approval: 'approved',
          latitude: 12.978400, longitude: 77.640800,
        },
        {
          name: 'Karan Mehta', email: 'karan.mehta@example.com', phone: '9000000024',
          bio: 'Fuel delivery and towing across the metro region.',
          experienceYears: 3, serviceArea: 'Bengaluru', availability: 'offline', approval: 'approved',
          latitude: 12.969800, longitude: 77.750000,
        },
        {
          name: 'Vikas Yadav', email: 'vikas.yadav@example.com', phone: '9000000025',
          bio: 'Newly joined roadside technician.',
          experienceYears: 2, serviceArea: 'Bengaluru', availability: 'offline', approval: 'pending',
          latitude: 12.925000, longitude: 77.593800,
        },
      ];
      const mechanicIds = {};
      const mechanicCoords = {};
      for (const m of mechanicSeeds) {
        const [user] = await conn.query(
          `INSERT INTO users (name, email, password_hash, phone, role, status)
           VALUES (?, ?, ?, ?, 'mechanic', 'active') RETURNING id`,
          [m.name, m.email, customerDemoHash, m.phone]
        );
        await conn.query(
          `INSERT INTO mechanics (user_id, bio, experience_years, service_area, availability_status, approval_status, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [user.id, m.bio, m.experienceYears, m.serviceArea, m.availability, m.approval, m.latitude, m.longitude]
        );
        mechanicIds[m.email] = user.id;
        mechanicCoords[m.email] = { latitude: m.latitude, longitude: m.longitude };
      }

      console.log('[seed] Creating services...');
      const serviceSeeds = [
        { name: 'Flat Tyre', description: 'Puncture repair or spare tyre fitting at your location.', basePrice: 300 },
        { name: 'Battery Jump Start', description: 'Quick jump start for a dead battery.', basePrice: 250 },
        { name: 'Battery Replacement', description: 'On-the-spot battery replacement.', basePrice: 2500 },
        { name: 'Fuel Delivery', description: 'Emergency fuel delivery when you run out on the road.', basePrice: 400 },
        { name: 'Engine Problem', description: 'Diagnosis and roadside fix for engine trouble.', basePrice: 1200 },
        { name: 'Towing', description: 'Tow your vehicle to the nearest garage.', basePrice: 1500 },
        { name: 'General Breakdown Assistance', description: 'Not sure what is wrong? General on-site diagnosis and help.', basePrice: 600 },
      ];
      const serviceIds = {};
      const servicePrices = {};
      for (const s of serviceSeeds) {
        const [service] = await conn.query(
          `INSERT INTO services (name, description, base_price, is_active) VALUES (?, ?, ?, TRUE) RETURNING id`,
          [s.name, s.description, s.basePrice]
        );
        serviceIds[s.name] = service.id;
        servicePrices[s.name] = s.basePrice;
      }

      console.log('[seed] Mapping mechanic skills...');
      const mechanicServiceMap = {
        'suresh.kumar@example.com': ['Flat Tyre', 'Battery Jump Start', 'Battery Replacement', 'Engine Problem'],
        'manoj.singh@example.com': ['Flat Tyre', 'Fuel Delivery', 'Towing', 'General Breakdown Assistance'],
        'ravi.teja@example.com': ['Battery Jump Start', 'Battery Replacement', 'Engine Problem', 'General Breakdown Assistance'],
        'karan.mehta@example.com': ['Flat Tyre', 'Fuel Delivery', 'Towing'],
        'vikas.yadav@example.com': ['Flat Tyre', 'Battery Jump Start'],
      };
      for (const [email, svcs] of Object.entries(mechanicServiceMap)) {
        for (const serviceName of svcs) {
          await conn.query(`INSERT INTO mechanic_services (mechanic_id, service_id) VALUES (?, ?)`, [mechanicIds[email], serviceIds[serviceName]]);
        }
      }

      console.log('[seed] Creating vehicles...');
      const vehicleSeeds = [
        { owner: 'rahul.sharma@example.com', vehicleType: 'Car', brand: 'Honda', model: 'City', reg: 'KA01AB1234' },
        { owner: 'rahul.sharma@example.com', vehicleType: 'Bike', brand: 'Royal Enfield', model: 'Classic 350', reg: 'KA01CD5678' },
        { owner: 'priya.nair@example.com', vehicleType: 'Car', brand: 'Maruti Suzuki', model: 'Swift', reg: 'MH02EF9012' },
        { owner: 'amit.verma@example.com', vehicleType: 'Truck', brand: 'Tata', model: '407', reg: 'DL03GH3456' },
        { owner: 'amit.verma@example.com', vehicleType: 'Car', brand: 'Hyundai', model: 'Creta', reg: 'DL03IJ7890' },
        { owner: 'sneha.reddy@example.com', vehicleType: 'Bike', brand: 'TVS', model: 'Apache RTR', reg: 'TS04KL1122' },
      ];
      const vehicleIds = {};
      for (const v of vehicleSeeds) {
        const [vehicle] = await conn.query(
          `INSERT INTO vehicles (customer_id, vehicle_type, brand, model, registration_number) VALUES (?, ?, ?, ?, ?) RETURNING id`,
          [customerIds[v.owner], v.vehicleType, v.brand, v.model, v.reg]
        );
        vehicleIds[v.reg] = vehicle.id;
      }

      console.log('[seed] Creating bookings across the workflow...');
      async function insertBooking({ customerEmail, reg, mechanicEmail, serviceName, description, location, status, extra = {} }) {
        const timestamps = {
          accepted_at: ['accepted', 'in_progress', 'completed'].includes(status) ? new Date() : null,
          started_at: ['in_progress', 'completed'].includes(status) ? new Date() : null,
          completed_at: status === 'completed' ? new Date() : null,
          cancelled_at: status === 'cancelled' ? new Date() : null,
        };
        const mechCoord = mechanicCoords[mechanicEmail];
        const latitude = mechCoord.latitude + 0.015;
        const longitude = mechCoord.longitude + 0.012;
        const distanceKm = Math.round(haversineDistanceKm(latitude, longitude, mechCoord.latitude, mechCoord.longitude) * 10) / 10;
        const etaMinutes = estimateEtaMinutes(distanceKm);

        const [booking] = await conn.query(
          `INSERT INTO bookings
             (customer_id, vehicle_id, mechanic_id, service_id, problem_description, location_address,
              latitude, longitude, price_snapshot, distance_km, eta_minutes,
              status, accepted_at, started_at, completed_at, cancelled_at, cancellation_reason)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
          [
            customerIds[customerEmail], vehicleIds[reg], mechanicIds[mechanicEmail], serviceIds[serviceName],
            description, location, latitude, longitude, servicePrices[serviceName], distanceKm, etaMinutes,
            status, timestamps.accepted_at, timestamps.started_at, timestamps.completed_at, timestamps.cancelled_at,
            extra.cancellationReason || null,
          ]
        );
        return booking.id;
      }

      const b1 = await insertBooking({ customerEmail: 'rahul.sharma@example.com', reg: 'KA01AB1234', mechanicEmail: 'suresh.kumar@example.com', serviceName: 'Engine Problem', description: 'Engine making a knocking noise and lost power on the highway.', location: 'NH-44 near Hebbal Flyover, Bengaluru', status: 'completed' });
      const b2 = await insertBooking({ customerEmail: 'rahul.sharma@example.com', reg: 'KA01CD5678', mechanicEmail: 'manoj.singh@example.com', serviceName: 'Flat Tyre', description: 'Rear tyre punctured, need a replacement.', location: 'Indiranagar 100ft Road, Bengaluru', status: 'completed' });
      const b3 = await insertBooking({ customerEmail: 'priya.nair@example.com', reg: 'MH02EF9012', mechanicEmail: 'suresh.kumar@example.com', serviceName: 'Battery Replacement', description: 'Car will not start, battery is over 4 years old.', location: 'Church Street, Bengaluru', status: 'completed' });
      await insertBooking({ customerEmail: 'priya.nair@example.com', reg: 'MH02EF9012', mechanicEmail: 'ravi.teja@example.com', serviceName: 'Battery Jump Start', description: 'Left headlights on overnight, battery is dead.', location: '100 Feet Road, Indiranagar, Bengaluru', status: 'in_progress' });
      await insertBooking({ customerEmail: 'amit.verma@example.com', reg: 'DL03GH3456', mechanicEmail: 'manoj.singh@example.com', serviceName: 'Towing', description: 'Truck broke down and will not restart, needs towing to garage.', location: 'Sony World Signal, Koramangala, Bengaluru', status: 'accepted' });
      await insertBooking({ customerEmail: 'amit.verma@example.com', reg: 'DL03IJ7890', mechanicEmail: 'karan.mehta@example.com', serviceName: 'Fuel Delivery', description: 'Ran out of diesel on the expressway.', location: 'ITPL Main Road, Whitefield, Bengaluru', status: 'pending' });
      await insertBooking({ customerEmail: 'sneha.reddy@example.com', reg: 'TS04KL1122', mechanicEmail: 'suresh.kumar@example.com', serviceName: 'Flat Tyre', description: 'Front tyre punctured near the mall.', location: 'Residency Road, Bengaluru', status: 'cancelled', extra: { cancellationReason: 'Found local help nearby before the mechanic arrived.' } });
      await insertBooking({ customerEmail: 'sneha.reddy@example.com', reg: 'TS04KL1122', mechanicEmail: 'manoj.singh@example.com', serviceName: 'General Breakdown Assistance', description: 'Bike stalling repeatedly, unsure of the cause.', location: 'Forum Mall, Koramangala, Bengaluru', status: 'rejected' });
      await insertBooking({ customerEmail: 'sneha.reddy@example.com', reg: 'TS04KL1122', mechanicEmail: 'ravi.teja@example.com', serviceName: 'General Breakdown Assistance', description: 'Bike stalling repeatedly, unsure of the cause.', location: 'Old Airport Road, Indiranagar, Bengaluru', status: 'pending' });

      console.log('[seed] Creating reviews for completed bookings...');
      const reviewSeeds = [
        { bookingId: b1, customerEmail: 'rahul.sharma@example.com', mechanicEmail: 'suresh.kumar@example.com', rating: 5, comment: 'Suresh arrived quickly and fixed the engine issue on the spot. Excellent service!' },
        { bookingId: b2, customerEmail: 'rahul.sharma@example.com', mechanicEmail: 'manoj.singh@example.com', rating: 4, comment: 'Good service, changed the tyre fast, though arrived a few minutes late.' },
        { bookingId: b3, customerEmail: 'priya.nair@example.com', mechanicEmail: 'suresh.kumar@example.com', rating: 5, comment: 'Very professional, replaced the battery within 30 minutes.' },
      ];
      for (const r of reviewSeeds) {
        await conn.query(`INSERT INTO reviews (booking_id, customer_id, mechanic_id, rating, comment) VALUES (?, ?, ?, ?, ?)`, [r.bookingId, customerIds[r.customerEmail], mechanicIds[r.mechanicEmail], r.rating, r.comment]);
      }
    });

    console.log('\n[seed] Done! Demo credentials (all use password: ' + DEMO_PASSWORD + ' except admin):');
    console.log('  Admin:     admin@roadrescue.com / ' + ADMIN_PASSWORD);
    console.log('  Customer:  rahul.sharma@example.com / ' + DEMO_PASSWORD);
    console.log('  Mechanic:  suresh.kumar@example.com / ' + DEMO_PASSWORD);
    console.log('  Mechanic (pending approval): vikas.yadav@example.com / ' + DEMO_PASSWORD);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
