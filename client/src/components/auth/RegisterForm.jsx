import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

const RegisterForm = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success('Registered successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/70 backdrop-blur-sm rounded-2xl p-10 border border-slate-200/50 shadow-lg max-w-md mx-auto"
      noValidate
      aria-label="Registration form"
    >
      <h2 className="text-3xl font-bold mb-8 text-slate-900 text-center select-none">Create Account</h2>

      <label htmlFor="name" className="block mb-2 text-slate-700 font-medium">
        Full Name
      </label>
      <input
        id="name"
        type="text"
        placeholder="Your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 mb-6 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        required
        aria-required="true"
        maxLength={50}
        autoComplete="name"
      />

      <label htmlFor="email" className="block mb-2 text-slate-700 font-medium">
        Email address
      </label>
      <input
        id="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-3 mb-6 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        required
        aria-required="true"
        autoComplete="email"
      />

      <label htmlFor="password" className="block mb-2 text-slate-700 font-medium">
        Password
      </label>
      <input
        id="password"
        type="password"
        placeholder="Minimum 6 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-3 mb-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        required
        aria-required="true"
        minLength={6}
        autoComplete="new-password"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
        aria-busy={loading}
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
