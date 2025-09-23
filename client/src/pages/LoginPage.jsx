import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm.jsx';

const LoginPage = () => (
  <main className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-gray-100 to-white p-6">
    <div className="max-w-md w-full mx-auto">
      <LoginForm />
      <p className="text-center mt-6 text-gray-600">
        Don’t have an account?{' '}
        <Link to="/register" className="text-gray-900 font-semibold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  </main>
);

export default LoginPage;
