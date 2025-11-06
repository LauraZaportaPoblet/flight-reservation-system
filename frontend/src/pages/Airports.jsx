import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Airports() {
  const { getToken } = useAuth();
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAirports();
  }, []);

  const loadAirports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/airports`);
      const data = await res.json();
      setAirports(data);
    } catch (e) {
      console.error('Failed to load airports:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/airports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', location: '' });
        loadAirports();
      } else {
        alert('Failed to create airport');
      }
    } catch (e) {
      alert('Error creating airport');
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Airports</h1>
          <p className="text-gray-600">Manage airport locations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Airport
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {airports.map((airport) => (
          <div key={airport.Airport_ID} className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-primary">🏢 {airport.Name}</h2>
              <p className="text-sm opacity-70">📍 {airport.Location}</p>
              <div className="card-actions justify-end mt-4">
                <div className="badge badge-primary">ID: {airport.Airport_ID}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <dialog className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Airport</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Airport Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Location</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
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

