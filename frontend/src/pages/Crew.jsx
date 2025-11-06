import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

export default function Crew() {
  const { getToken } = useAuth();
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', role: 'Attendant' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCrew();
  }, []);

  const loadCrew = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/crew`);
      const data = await res.json();
      setCrew(data);
    } catch (e) {
      console.error('Failed to load crew:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/crew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', role: 'Attendant' });
        loadCrew();
      } else {
        alert('Failed to create crew member');
      }
    } catch (e) {
      alert('Error creating crew member');
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

  const getRoleBadgeColor = (role) => {
    if (role.includes('Pilot')) return 'badge-primary';
    if (role.includes('Attendant')) return 'badge-secondary';
    return 'badge-accent';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Crew</h1>
          <p className="text-gray-600">Manage airline crew members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Crew Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crew.map((member) => (
          <div key={member.Crew_ID} className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-primary">👥 {member.Name}</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className={`badge ${getRoleBadgeColor(member.Role)} badge-lg`}>{member.Role}</div>
              </div>
              <div className="card-actions justify-end mt-4">
                <div className="badge badge-primary">ID: {member.Crew_ID}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <dialog className={`modal ${showModal ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add New Crew Member</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Name</span>
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
                <span className="label-text font-semibold">Role</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option>Pilot</option>
                <option>Co-Pilot</option>
                <option>Attendant</option>
              </select>
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

