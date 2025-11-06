import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Aircraft() {
  const { getToken } = useAuth();
  const [aircraft, setAircraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ model: '', capacity: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAircraft();
  }, []);

  const loadAircraft = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/aircraft`);
      const data = await res.json();
      setAircraft(data);
    } catch (e) {
      console.error('Failed to load aircraft:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/aircraft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, capacity: parseInt(formData.capacity) })
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ model: '', capacity: '' });
        loadAircraft();
      } else {
        alert('Failed to create aircraft');
      }
    } catch (e) {
      alert('Error creating aircraft');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Aircraft</h1>
          <p className="text-gray-600">Manage aircraft fleet</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Aircraft
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aircraft.map((ac) => (
          <div key={ac.Aircraft_ID} className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-primary">🛫 {ac.Model}</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="badge badge-secondary badge-lg">Capacity: {ac.Capacity}</div>
              </div>
              <div className="card-actions justify-end mt-4">
                <div className="badge badge-primary">ID: {ac.Aircraft_ID}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <dialog className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Aircraft</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Model</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Capacity</span>
              </label>
              <input
                type="number"
                className="input input-bordered w-full"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${submitting ? 'loading' : ''}`}>
                Create
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}

