/**
 * Login Form Component - OPTIMIZED WITH UTILITIES
 * Enhanced with better validation and error handling
 */
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authValidation, validateFormData } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
import { formatError } from '../../utils/formatters';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm = () => {
  const { login, isLoading, error, clearError } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm({
    mode: 'onBlur' // Better UX with onBlur validation
  });

  // ENHANCED: Form submission with utility-based validation
  const onSubmit = async (data) => {
    // Clear any previous errors
    clearError?.();

    // Use utility validation for extra safety
    const validation = validateFormData(data, {
      email: authValidation.email,
      password: { required: 'Password is required' }
    });

    if (!validation.isValid) {
      // Set form errors using validation utility
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { message });
      });
      return;
    }

    try {
      await login(data);
    } catch (err) {
      // Handle login-specific errors
      const errorMessage = formatError(err);
      if (errorMessage.toLowerCase().includes('email')) {
        setError('email', { message: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setError('password', { message: errorMessage });
      }
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

        {/* ENHANCED: Show global auth errors */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{formatError(error)}</p>
          </div>
        )}

        {/* Form */}
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
