// src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import * as userService from '../services/userService.js'
import Avatar from '../components/common/Avatar.jsx'
import Button from '../components/common/Button.jsx'
import Input from '../components/common/Input.jsx'

export default function Profile() {
  const { user, token, logout } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', status: '', avatar: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' })
  const [passMsg, setPassMsg] = useState(null)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        status: user.status || '',
        avatar: user.avatar || '',
      })
    }
  }, [user])

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handlePasswordChange = (e) =>
    setPassData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)
    try {
      await userService.updateProfile(form, token)
      setMessage('Profile updated successfully.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setPassMsg(null)
    setLoading(true)
    try {
      await userService.changePassword(passData, token)
      setPassMsg('Password changed successfully.')
      setPassData({ currentPassword: '', newPassword: '' })
    } catch (e) {
      setPassMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-backgroundLight dark:bg-backgroundDark flex flex-col items-center justify-center px-6 py-10">
      <section className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md space-y-6 shadow-lg text-textDark dark:text-textLight">
        <div className="flex flex-col items-center space-y-4">
          <Avatar src={form.avatar} alt={form.name} size={120} status={form.status} />
          <h1 className="text-2xl font-bold">{form.name}</h1>
        </div>
        <form onSubmit={handleProfileUpdate} className="space-y-4" aria-label="Update profile form">
          <Input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full Name"
            disabled={loading}
          />
          <Input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            disabled={loading}
          />
          <Input
            name="status"
            value={form.status}
            onChange={handleChange}
            placeholder="Status"
            disabled={loading}
          />
          <Input
            name="avatar"
            value={form.avatar}
            onChange={handleChange}
            placeholder="Avatar URL"
            disabled={loading}
          />
          {message && <p className="text-green-600">{message}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>

        <form onSubmit={handlePasswordUpdate} className="space-y-4" aria-label="Change password form">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <Input
            type="password"
            name="currentPassword"
            value={passData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Current Password"
            disabled={loading}
          />
          <Input
            type="password"
            name="newPassword"
            value={passData.newPassword}
            onChange={handlePasswordChange}
            placeholder="New Password"
            disabled={loading}
          />
          {passMsg && <p className="text-green-600">{passMsg}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </form>

        <Button onClick={logout} className="w-full bg-red-600 hover:bg-red-700">
          Logout
        </Button>
      </section>
    </main>
  )
}
