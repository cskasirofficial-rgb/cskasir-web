import React from 'react';

export interface NavbarProps {
  username?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ username = 'Kasir', onLogout }) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Section: Title and Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg
              className="w-6 h-6 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xl font-bold tracking-wider text-white">CSKasir</span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-full text-xs font-medium text-emerald-400 border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Online</span>
          </div>
        </div>

        {/* Right Section: Profile & Logout */}
        <div className="flex items-center space-x-4">
          {/* User Profile Info */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-200 border border-slate-600">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline-block text-sm font-medium text-slate-300">
              {username}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
