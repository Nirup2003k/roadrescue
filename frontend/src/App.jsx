import React from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicNavbar from './components/layout/PublicNavbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';

import CustomerDashboard from './pages/customer/Dashboard';
import CustomerVehicles from './pages/customer/Vehicles';
import RequestAssistance from './pages/customer/RequestAssistance';
import CustomerBookings from './pages/customer/Bookings';
import BookingDetails from './pages/customer/BookingDetails';
import CustomerProfile from './pages/customer/Profile';
import CustomerReviews from './pages/customer/Reviews';

import MechanicDashboard from './pages/mechanic/Dashboard';
import IncomingRequests from './pages/mechanic/IncomingRequests';
import ActiveJobs from './pages/mechanic/ActiveJobs';
import JobHistory from './pages/mechanic/JobHistory';
import MechanicProfile from './pages/mechanic/Profile';
import MechanicReviews from './pages/mechanic/Reviews';

import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminMechanics from './pages/admin/Mechanics';
import AdminServices from './pages/admin/Services';
import AdminBookings from './pages/admin/Bookings';
import AdminReviews from './pages/admin/Reviews';
import AdminComplaints from './pages/admin/Complaints';

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
      <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
      <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

      <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/vehicles" element={<ProtectedRoute allowedRoles={['customer']}><CustomerVehicles /></ProtectedRoute>} />
      <Route path="/customer/request" element={<ProtectedRoute allowedRoles={['customer']}><RequestAssistance /></ProtectedRoute>} />
      <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['customer']}><CustomerBookings /></ProtectedRoute>} />
      <Route path="/customer/bookings/:id" element={<ProtectedRoute allowedRoles={['customer']}><BookingDetails /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />
      <Route path="/customer/reviews" element={<ProtectedRoute allowedRoles={['customer']}><CustomerReviews /></ProtectedRoute>} />

      <Route path="/mechanic" element={<ProtectedRoute allowedRoles={['mechanic']}><MechanicDashboard /></ProtectedRoute>} />
      <Route path="/mechanic/requests" element={<ProtectedRoute allowedRoles={['mechanic']}><IncomingRequests /></ProtectedRoute>} />
      <Route path="/mechanic/active" element={<ProtectedRoute allowedRoles={['mechanic']}><ActiveJobs /></ProtectedRoute>} />
      <Route path="/mechanic/history" element={<ProtectedRoute allowedRoles={['mechanic']}><JobHistory /></ProtectedRoute>} />
      <Route path="/mechanic/profile" element={<ProtectedRoute allowedRoles={['mechanic']}><MechanicProfile /></ProtectedRoute>} />
      <Route path="/mechanic/reviews" element={<ProtectedRoute allowedRoles={['mechanic']}><MechanicReviews /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomers /></ProtectedRoute>} />
      <Route path="/admin/mechanics" element={<ProtectedRoute allowedRoles={['admin']}><AdminMechanics /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['admin']}><AdminReviews /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute allowedRoles={['admin']}><AdminComplaints /></ProtectedRoute>} />

      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  );
}
