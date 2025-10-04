/**
 * Login Form Component
 * Streamlined login with enhanced Input component
 */

import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authValidation } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm = () => {
  const { login, isLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    await login(data);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            type="email"
            placeholder="Enter your email"
            icon={<Mail className="w-5 h-5" />}
            error={errors.email?.message}
            {...register('email', authValidation.email)}
          />

          <Input
            type="password"
            placeholder="Enter your password"
            icon={<Lock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register('password', authValidation.password)}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
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
