import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Logged in successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/70 backdrop-blur-sm rounded-2xl p-10 border border-slate-200/50 shadow-lg max-w-md mx-auto"
      noValidate
      aria-label="Login form"
    >
      <h2 className="text-3xl font-bold mb-8 text-slate-900 text-center select-none">Sign In</h2>

      <label htmlFor="email" className="block mb-2 text-slate-700 font-medium">
        Email address
      </label>
      <input
        type="email"
        id="email"
        className="w-full p-3 mb-6 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="username"
        aria-required="true"
      />

      <label htmlFor="password" className="block mb-2 text-slate-700 font-medium">
        Password
      </label>
      <input
        type="password"
        id="password"
        className="w-full p-3 mb-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        aria-required="true"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
        aria-busy={loading}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;
