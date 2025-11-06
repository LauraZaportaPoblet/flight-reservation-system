import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Tickets() {
  const { getToken } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const getClassBadge = (klass) => {
    const colors = {
      ECONOMY: 'badge-info',
      BUSINESS: 'badge-warning',
      FIRST: 'badge-error'
    };
    return colors[klass] || 'badge-info';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Tickets</h1>
        <p className="text-gray-600">View all issued tickets</p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <div className="text-6xl mb-4">🎟️</div>
          <p className="text-xl opacity-70">No tickets found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Ticket Code</th>
                <th>Flight</th>
                <th>Date</th>
                <th>Time</th>
                <th>Seat</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.Ticket_ID}>
                  <td>
                    <div className="font-bold text-primary">{ticket.Ticket_Code}</div>
                  </td>
                  <td>{ticket.Flight_Number}</td>
                  <td>{new Date(ticket.Flight_Date).toLocaleDateString()}</td>
                  <td>{ticket.Flight_Time}</td>
                  <td>
                    <div className="badge badge-secondary">{ticket.Seat_No}</div>
                  </td>
                  <td>
                    <div className={`badge ${getClassBadge(ticket.Class)}`}>{ticket.Class}</div>
                  </td>
                  <td>
                    <div className={`badge ${ticket.Status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                      {ticket.Status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

