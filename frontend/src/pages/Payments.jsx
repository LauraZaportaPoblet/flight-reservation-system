import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Payments() {
  const { getToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(data);
    } catch (e) {
      console.error('Failed to load payments:', e);
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

  const getModeIcon = (mode) => {
    const icons = {
      CARD: '💳',
      UPI: '📱',
      CASH: '💵',
      WALLET: '💼'
    };
    return icons[mode] || '💰';
  };

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.Amount || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Payments</h1>
        <p className="text-gray-600">View all payment transactions</p>
      </div>

      {payments.length > 0 && (
        <div className="card bg-primary text-primary-content mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">Total Payments</div>
                <div className="text-3xl font-bold">₹ {totalAmount.toLocaleString()}</div>
              </div>
              <div className="text-5xl opacity-80">💰</div>
            </div>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-xl opacity-70">No payments found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Flight</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Paid At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.Payment_ID}>
                  <td>
                    <div className="font-bold">#{payment.Payment_ID}</div>
                  </td>
                  <td>{payment.Flight_Number}</td>
                  <td>
                    <div className="font-bold text-primary">₹ {Number(payment.Amount).toLocaleString()}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span>{getModeIcon(payment.Mode)}</span>
                      <span>{payment.Mode}</span>
                    </div>
                  </td>
                  <td>{new Date(payment.Paid_At).toLocaleString()}</td>
                  <td>
                    <div className={`badge ${payment.Status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                      {payment.Status}
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

