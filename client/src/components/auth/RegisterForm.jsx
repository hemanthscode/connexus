/**
 * Register Form Component - OPTIMIZED WITH UTILITIES
 * Enhanced with comprehensive validation and error handling
 */
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authValidation, validateFormData, validatePassword } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
import { formatError } from '../../utils/formatters';
import Button from '../ui/Button';
import Input from '../ui/Input';

const RegisterForm = () => {
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm({
    mode: 'onBlur'
  });

  const password = watch('password');

  // ENHANCED: Form submission with comprehensive validation
  const onSubmit = async (formData) => {
    // Clear previous errors
    clearError?.();

    // Remove confirmPassword from submission data
    const { confirmPassword, ...userData } = formData;

    // Use utility validation for comprehensive checking
    const validation = validateFormData(formData, {
      name: authValidation.name,
      email: authValidation.email,
      password: authValidation.password,
      confirmPassword: authValidation.confirmPassword(password)
    });

    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        setError(field, { message });
      });
      return;
    }

    // ENHANCED: Additional password strength validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      setError('password', { 
        message: passwordCheck.feedback.join('. ') 
      });
      return;
    }

    try {
      await registerUser(userData);
    } catch (err) {
      // Handle registration-specific errors with better field mapping
      const errorMessage = formatError(err);
      
      if (errorMessage.toLowerCase().includes('email')) {
        setError('email', { message: 'Email already exists or is invalid' });
      } else if (errorMessage.toLowerCase().includes('name')) {
        setError('name', { message: errorMessage });
      } else {
        // Generic error handling
        setError('root', { message: errorMessage });
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Join Connexus today</p>
        </div>

        {/* ENHANCED: Show global errors */}
        {(error || errors.root) && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              {formatError(error) || errors.root?.message}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            type="text"
            placeholder="Enter your full name"
            icon={<User className="w-5 h-5" />}
            error={errors.name?.message}
            autoComplete="name"
            {...register('name', authValidation.name)}
          />

          <Input
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email', authValidation.email)}
          />

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Create a password"
              icon={<Lock className="w-5 h-5" />}
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password', authValidation.password)}
            />
            
            {/* ENHANCED: Password strength indicator */}
            {password && (
              <div className="text-xs">
                {(() => {
                  const strength = validatePassword(password);
                  const colors = {
                    weak: 'text-red-400',
                    medium: 'text-yellow-400', 
                    strong: 'text-green-400'
                  };
                  return (
                    <span className={colors[strength.strength] || colors.weak}>
                      Password strength: {strength.strength || 'weak'}
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          <Input
            type="password"
            placeholder="Confirm your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword', authValidation.confirmPassword(password))}
          />

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            fullWidth 
            loading={isLoading}
            disabled={isLoading}
          >
            Create Account
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Already have an account?{' '}
            <Link 
              to={ROUTES.LOGIN} 
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
