import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/flights', label: 'Flights', icon: '✈️' },
    { path: '/airports', label: 'Airports', icon: '🏢' },
    { path: '/aircraft', label: 'Aircraft', icon: '🛫' },
    { path: '/airlines', label: 'Airlines', icon: '🎫' },
    { path: '/routes', label: 'Routes', icon: '🗺️' },
    { path: '/crew', label: 'Crew', icon: '👥' },
    { path: '/reservations', label: 'Reservations', icon: '📋' },
    { path: '/tickets', label: 'Tickets', icon: '🎟️' },
    { path: '/payments', label: 'Payments', icon: '💳' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-base-100">
      {/* Top Navbar */}
      <div className="navbar bg-base-200 shadow-lg sticky top-0 z-40">
        <div className="flex-1">
          <button
            className="btn btn-ghost lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/dashboard" className="btn btn-ghost normal-case text-2xl text-primary font-bold">
            ✈️ FlyBook
          </Link>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl">
                👤
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300">
              <li className="menu-title">
                <span>{user?.Name}</span>
              </li>
              <li><span className="text-xs opacity-70">{user?.Email}</span></li>
              <li><span className="text-xs opacity-70">{user?.Phone}</span></li>
              <div className="divider my-1"></div>
              <li>
                <Link to="/profile">
                  Profile
                </Link>
              </li>
              <li><Link to="/settings">Settings</Link></li>
              <li><a onClick={handleLogout} className="text-error">Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-base-200 border-r border-base-300 transition-transform duration-300`}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-primary text-primary-content shadow-md'
                    : 'hover:bg-base-300 text-base-content'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

