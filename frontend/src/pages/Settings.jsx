import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import axios from 'axios';
import { API_BASE } from '../config';

export default function Settings() {
  const { user, getToken } = useAuth();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    theme: localStorage.getItem('theme') || 'light',
    language: 'en'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Apply theme on mount and when it changes
    const theme = settings.theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [settings.theme]);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleThemeChange = (e) => {
    const newTheme = e.target.value;
    setSettings({ ...settings, theme: newTheme });
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      return;
    }

    try {
      const token = getToken();
      await axios.put(
        `${API_BASE}/api/passengers/${user.Passenger_ID}/password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to change password' 
      });
    }
  };

  const handleSave = () => {
    setMessage({ type: 'success', text: 'Settings saved successfully!' });
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        {message.text && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4 max-w-2xl`}>
            <span>{message.text}</span>
          </div>
        )}

        <div className="max-w-2xl space-y-6">
          {/* Account Settings */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Account Settings</h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Account Email</span>
                </label>
                <input 
                  type="email" 
                  value={user?.Email || ''} 
                  disabled 
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt">Contact support to change your email</span>
                </label>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Change Password</h2>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Current Password</span>
                  </label>
                  <input 
                    type="password" 
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="input input-bordered w-full"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">New Password</span>
                  </label>
                  <input 
                    type="password" 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="input input-bordered w-full"
                    required
                    minLength={6}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Confirm New Password</span>
                  </label>
                  <input 
                    type="password" 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="input input-bordered w-full"
                    required
                    minLength={6}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Notifications</h2>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Email Notifications</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary" 
                    checked={settings.emailNotifications}
                    onChange={() => handleToggle('emailNotifications')}
                  />
                </label>
                <p className="text-xs opacity-70 ml-2">Receive booking confirmations and updates via email</p>
              </div>

              <div className="form-control mt-4">
                <label className="label cursor-pointer">
                  <span className="label-text">SMS Notifications</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-secondary" 
                    checked={settings.smsNotifications}
                    onChange={() => handleToggle('smsNotifications')}
                  />
                </label>
                <p className="text-xs opacity-70 ml-2">Get flight updates via SMS</p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Preferences</h2>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Theme</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={settings.theme}
                  onChange={handleThemeChange}
                >
                  <option value="light">☀️ Light</option>
                  <option value="dark">🌙 Dark</option>
                  <option value="cupcake">🧁 Cupcake</option>
                  <option value="cyberpunk">🌆 Cyberpunk</option>
                  <option value="forest">🌲 Forest</option>
                </select>
                <label className="label">
                  <span className="label-text-alt">Changes apply immediately</span>
                </label>
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text font-semibold">Language</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="es">Español (Spanish)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-error">Danger Zone</h2>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Delete Account</span>
                  <button className="btn btn-sm btn-error" disabled>Delete</button>
                </label>
                <p className="text-xs opacity-70 ml-2">Permanently delete your account and all data</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <button className="btn btn-ghost">Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
