import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = () => {
  return (
    <div className="flex bg-zinc-950 min-h-screen">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header Controls */}
        <Topbar />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto p-8 bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
