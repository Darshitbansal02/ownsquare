import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import ProtectedRoute from './ProtectedRoute.jsx';
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  return <ProtectedRoute>{user && !roles.includes(user.role) ? <Navigate to="/403" replace /> : children ?? <Outlet />}</ProtectedRoute>;
}
