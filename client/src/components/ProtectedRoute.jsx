import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-emerald-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <span className="ml-3 font-semibold text-lg tracking-wide">EVNest Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user tries to access merchant page but they are a driver
    if (user.role === 'user') {
      return <Navigate to="/" replace />;
    }
    // If merchant tries to access user page
    return <Navigate to="/merchant" replace />;
  }

  return children;
};

export default ProtectedRoute;
