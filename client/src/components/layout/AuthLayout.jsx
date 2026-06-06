import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthLayout = () => {
  const { user } = useAuth();

  // If user is already authenticated, redirect them to the home dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-100">
      {/* Brand Label */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-xl bg-brand-500/10 items-center justify-center border border-brand-500/30 mb-4 glow-green">
          <svg className="w-6 h-6 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 12a9 9 0 0 1 18 0" />
            <path d="M3 16h18" />
            <path d="M12 3v9" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">VendorBridge</h2>
        <p className="mt-1.5 text-sm text-zinc-400">Digitizing the procurement lifecycle</p>
      </div>

      {/* Auth Outlet Viewport */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900/60 border border-zinc-800/80 py-8 px-4 shadow-xl rounded-xl sm:px-10 backdrop-blur-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
