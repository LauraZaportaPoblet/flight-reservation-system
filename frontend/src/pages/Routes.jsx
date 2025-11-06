import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function RoutesPage() {
  const { getToken } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ source: '', destination: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/routes`);
      const data = await res.json();
      setRoutes(data);
    } catch (e) {
      console.error('Failed to load routes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ source: '', destination: '' });
        loadRoutes();
      } else {
        alert('Failed to create route');
      }
    } catch (e) {
      alert('Error creating route');
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Routes</h1>
          <p className="text-gray-600">Manage flight routes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Route
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route) => (
          <div key={route.Route_ID} className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🗺️</span>
                <h2 className="card-title">{route.Source} → {route.Destination}</h2>
              </div>
              <div className="card-actions justify-end mt-4">
                <div className="badge badge-primary">ID: {route.Route_ID}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <dialog className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Route</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Source</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Destination</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
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

