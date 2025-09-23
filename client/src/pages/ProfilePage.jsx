import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import axios from 'axios';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    status: '',
    avatar: '',
    bio: '',
    location: '',
    socialLinks: {},
  });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('connexus_token');
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data.data);
        setFormState({
          name: res.data.data.name || '',
          email: res.data.data.email || '',
          status: res.data.data.status || '',
          avatar: res.data.data.avatar || '',
          bio: res.data.data.bio || '',
          location: res.data.data.location || '',
          socialLinks: res.data.data.socialLinks || {},
        });
      } catch (error) {
        toast.error('Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormState((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('connexus_token');
      await axios.put(`${API_BASE}/auth/me`, formState, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <Layout>
      <section className="max-w-3xl w-full mx-auto mt-8 p-6 bg-white rounded shadow">
        <h1 className="text-xl font-semibold mb-6">User Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block font-medium mb-1">Name</label>
            <input
              id="name"
              name="name"
              value={formState.name}
              onChange={handleChange}
              required
              maxLength={50}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="status" className="block font-medium mb-1">Status</label>
            <select
              id="status"
              name="status"
              value={formState.status}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Select status</option>
              <option value="online">Online</option>
              <option value="away">Away</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label htmlFor="avatar" className="block font-medium mb-1">Avatar URL</label>
            <input
              id="avatar"
              name="avatar"
              value={formState.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block font-medium mb-1">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formState.bio}
              onChange={handleChange}
              maxLength={250}
              rows={3}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>
          <div>
            <label htmlFor="location" className="block font-medium mb-1">Location</label>
            <input
              id="location"
              name="location"
              value={formState.location}
              onChange={handleChange}
              maxLength={100}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="font-medium mb-2">Social Links</legend>
            {['twitter', 'facebook', 'linkedin', 'instagram', 'github'].map((platform) => (
              <div key={platform}>
                <label htmlFor={`social-${platform}`} className="block text-sm font-medium mb-1 capitalize">
                  {platform}
                </label>
                <input
                  id={`social-${platform}`}
                  type="url"
                  value={formState.socialLinks[platform] || ''}
                  onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                  placeholder={`https://www.${platform}.com/yourprofile`}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            ))}
          </fieldset>
          <button
            type="submit"
            className="mt-4 px-6 py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </form>
      </section>
    </Layout>
  );
};

export default ProfilePage;
