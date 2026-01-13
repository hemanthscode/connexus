/**
 * Login Form Component - OPTIMIZED WITH UTILITIES
 * Enhanced with better validation, error handling,
 * and 1-click demo login for evaluators
 */

import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authValidation, validateFormData } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
import { formatError } from '../../utils/formatters';
import Button from '../ui/Button';
import Input from '../ui/Input';

// Demo users for evaluator convenience (non-production)
const TEST_USERS = [
  { name: 'Aadhya', email: 'aadhya@connexus.com', password: 'Password123' },
  { name: 'Arjun', email: 'arjun@connexus.com', password: 'Password123' },
  { name: 'Dhruv', email: 'dhruv@connexus.com', password: 'Password123' },
  { name: 'Neha', email: 'neha@connexus.com', password: 'Password123' },
];

const LoginForm = () => {
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    mode: 'onBlur',
  });

  // Standard login submit
  const onSubmit = async (data) => {
    clearError?.();

    const validation = validateFormData(data, {
      email: authValidation.email,
      password: { required: 'Password is required' },
    });

    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { message });
      });
      return;
    }

    try {
      await login(data);
    } catch (err) {
      const errorMessage = formatError(err);
      if (errorMessage.toLowerCase().includes('email')) {
        setError('email', { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setError('password', { message: errorMessage });
      }
    }
  };

  // 1-click demo login
  const handleTestLogin = async (user) => {
    clearError?.();
    try {
      await login({
        email: user.email,
        password: user.password,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>

        {/* Global auth error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{formatError(error)}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email', authValidation.email)}
          />

          <Input
            type="password"
            placeholder="Enter your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Login */}
        <div className="mt-8">
          <p className="text-center text-gray-400 text-sm mb-4">
            Quick Demo Login (1-Click)
          </p>

          <div className="grid grid-cols-2 gap-3">
            {TEST_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                onClick={() => handleTestLogin(user)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-4 py-2
                           rounded-lg bg-white/5 hover:bg-white/10
                           border border-white/10 text-gray-200 text-sm
                           transition-all"
              >
                <User className="w-4 h-4" />
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center space-y-2">
          <Link
            to="/forgot-password"
            className="text-gray-400 hover:text-gray-300 text-sm transition-colors block"
          >
            Forgot your password?
          </Link>

          <p className="text-gray-300">
            Don't have an account?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
