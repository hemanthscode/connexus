/**
 * Register Form Component
 * Streamlined registration with enhanced Input component
 */

import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authValidation } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
import Button from '../ui/Button';
import Input from '../ui/Input';

const RegisterForm = () => {
  const { register: registerUser, isLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    await registerUser(userData);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-300">Join Connexus today</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            type="text"
            placeholder="Enter your full name"
            icon={<User className="w-5 h-5" />}
            error={errors.name?.message}
            {...register('name', authValidation.name)}
          />

          <Input
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email', authValidation.email)}
          />

          <Input
            type="password"
            placeholder="Create a password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register('password', authValidation.password)}
          />

          <Input
            type="password"
            placeholder="Confirm your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', authValidation.confirmPassword(password))}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
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
