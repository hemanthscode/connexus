import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm.jsx';

const RegisterPage = () => (
  <main className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-gray-100 to-white p-6">
    <div className="max-w-md w-full mx-auto">
      <RegisterForm />
      <p className="text-center mt-6 text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-gray-900 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  </main>
);

export default RegisterPage;
