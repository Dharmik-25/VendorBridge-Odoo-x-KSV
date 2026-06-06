import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route guard to restrict access to logged-in users and specific roles.
 */
export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500"></div>
        <p className="mt-4 text-zinc-400 font-medium animate-pulse">Initializing Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Access Denied</h1>
        <p className="text-zinc-400 max-w-md mb-6">Your current role <strong>{user.role}</strong> does not have permission to view this resource.</p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-800 font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
};
