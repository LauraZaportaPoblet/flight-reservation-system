import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';
import { API_BASE } from '../config';

export default function Profile() {
  const { user, getToken, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    Name: user?.Name || '',
    Email: user?.Email || '',
    Phone: user?.Phone || ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      </DashboardLayout>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      Name: user.Name,
      Email: user.Email,
      Phone: user.Phone
    });
    setMessage({ type: '', text: '' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      Name: user.Name,
      Email: user.Email,
      Phone: user.Phone
    });
    setMessage({ type: '', text: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getToken();
      const response = await axios.put(
        `${API_BASE}/api/passengers/${user.Passenger_ID}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update user in context
      setUser({ ...user, ...editData });
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        
        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 max-w-2xl`}>
            <span>{message.text}</span>
          </div>
        )}
        
        <div className="card bg-base-200 shadow-xl max-w-2xl">
          <div className="card-body">
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar">
                <div className="w-24 rounded-full bg-primary text-primary-content flex items-center justify-center text-5xl">
                  👤
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.Name}</h2>
                <p className="text-sm opacity-70">Passenger ID: {user?.Passenger_ID}</p>
              </div>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Full Name</span>
                </label>
                <input 
                  type="text" 
                  value={isEditing ? editData.Name : user?.Name || ''} 
                  onChange={(e) => setEditData({...editData, Name: e.target.value})}
                  disabled={!isEditing} 
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Email Address</span>
                </label>
                <input 
                  type="email" 
                  value={isEditing ? editData.Email : user?.Email || ''} 
                  onChange={(e) => setEditData({...editData, Email: e.target.value})}
                  disabled={!isEditing} 
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Phone Number</span>
                </label>
                <input 
                  type="tel" 
                  value={isEditing ? editData.Phone : user?.Phone || ''} 
                  onChange={(e) => setEditData({...editData, Phone: e.target.value})}
                  disabled={!isEditing} 
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            <div className="card-actions justify-end mt-6">
              {!isEditing ? (
                <button className="btn btn-primary" onClick={handleEdit}>
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button className="btn btn-ghost" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-2xl">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Total Bookings</div>
            <div className="stat-value text-primary">0</div>
            <div className="stat-desc">All time</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Active Tickets</div>
            <div className="stat-value text-secondary">0</div>
            <div className="stat-desc">Current</div>
          </div>
          
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Member Since</div>
            <div className="stat-value text-accent text-2xl">2025</div>
            <div className="stat-desc">Active member</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
