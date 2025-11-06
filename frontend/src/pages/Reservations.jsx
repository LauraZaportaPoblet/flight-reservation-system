import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Reservations() {
  const { user, getToken } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadReservations();
  }, [user]);

  const loadReservations = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/passengers/${user.Passenger_ID}/reservations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setReservations(data);
    } catch (e) {
      console.error('Failed to load reservations:', e);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/reservations/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadReservations();
      } else {
        alert('Failed to cancel reservation');
      }
    } catch (e) {
      alert('Error canceling reservation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const colors = {
      CONFIRMED: 'badge-success',
      PENDING: 'badge-warning',
      CANCELLED: 'badge-error'
    };
    return colors[status] || 'badge-info';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">My Reservations</h1>
        <p className="text-gray-600">View and manage your flight reservations</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-xl opacity-70">No reservations found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((res) => (
            <div key={res.Reservation_ID} className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="card-title text-primary">Flight {res.Flight_Number}</h2>
                  <div className={`badge ${getStatusBadge(res.Status)} badge-lg`}>
                    {res.Status}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-70">Booking Date:</span>
                    <span className="font-semibold">{new Date(res.Booking_Date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Flight Date:</span>
                    <span className="font-semibold">{new Date(res.Date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Time:</span>
                    <span className="font-semibold">{res.Time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Seat:</span>
                    <span className="font-semibold">{res.Seat_No}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Class:</span>
                    <span className="font-semibold">{res.Class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Ticket Code:</span>
                    <span className="font-semibold text-primary">{res.Ticket_Code}</span>
                  </div>
                </div>
                {res.Status === 'CONFIRMED' && (
                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => cancelReservation(res.Reservation_ID)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

