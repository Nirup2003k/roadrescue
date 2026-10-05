import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './ui/Loader';
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader full label="Checking your session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = { customer: '/customer', mechanic: '/mechanic', admin: '/admin' }[user.role] || '/';
    return <Navigate to={home} replace />;
  }
  return children;
}
