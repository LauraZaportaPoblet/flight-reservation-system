import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, getToken } = useAuth();
  const [stats, setStats] = useState({
    flights: 0,
    reservations: 0,
    tickets: 0,
    payments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = getToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const [flightsRes, reservationsRes, ticketsRes, paymentsRes] = await Promise.all([
          fetch(`${API_BASE}/api/flights`).then(r => r.json()),
          fetch(`${API_BASE}/api/passengers/${user?.Passenger_ID}/reservations`, { headers }).then(r => r.json()),
          fetch(`${API_BASE}/api/tickets`, { headers }).then(r => r.json()),
          fetch(`${API_BASE}/api/payments`, { headers }).then(r => r.json()),
        ]);

        setStats({
          flights: flightsRes.length || 0,
          reservations: reservationsRes.length || 0,
          tickets: ticketsRes.length || 0,
          payments: paymentsRes.length || 0,
        });
      } catch (e) {
        console.error('Failed to load stats:', e);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadStats();
  }, [user, getToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const statCards = [
    { label: 'Available Flights', value: stats.flights, icon: '✈️', color: 'primary' },
    { label: 'My Reservations', value: stats.reservations, icon: '📋', color: 'secondary' },
    { label: 'My Tickets', value: stats.tickets, icon: '🎟️', color: 'accent' },
    { label: 'Payments Made', value: stats.payments, icon: '💳', color: 'info' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {user?.Name || 'User'}! 👋
        </h1>
        <p className="opacity-70">Here's an overview of your flight booking activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`card bg-${stat.color} text-${stat.color}-content shadow-xl`}>
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-80">{stat.label}</div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </div>
                <div className="text-5xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Quick Actions</h2>
            <div className="space-y-3 mt-4">
              <a href="/flights" className="btn btn-primary btn-block">
                Search Flights
              </a>
              <a href="/reservations" className="btn btn-secondary btn-block">
                View My Reservations
              </a>
              <a href="/tickets" className="btn btn-accent btn-block">
                My Tickets
              </a>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">Account Info</h2>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>{user?.Name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Email:</span>
                <span>{user?.Email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Phone:</span>
                <span>{user?.Phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

