import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-6 xl:grid-cols-2 xl:gap-8">
          <div className="hidden min-w-0 flex-col justify-center rounded-3xl bg-white p-8 shadow-xl xl:flex xl:p-12">
            <div className="mb-8 flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3">
                <ChefHat className="text-white" size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">RestroManagement</h1>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-4xl font-bold text-gray-900">
                  Manage Every Role Seamlessly
                </h2>
                <p className="text-lg leading-relaxed text-gray-600">
                  A unified platform for all restaurant staff — from Admins and Managers to Chefs and Waiters.
                  Access role-specific dashboards to simplify daily operations, enhance coordination, and deliver
                  better dining experiences.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-cyan-100 p-2">
                    <svg className="h-5 w-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Role-Based Access</h3>
                    <p className="text-sm text-gray-600">Admins, managers, chefs, and waiters each have tailored tools and permissions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-cyan-100 p-2">
                    <svg className="h-5 w-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Collaborative Workflow</h3>
                    <p className="text-sm text-gray-600">Seamless coordination between kitchen, service, and management</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-lg bg-cyan-100 p-2">
                    <svg className="h-5 w-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-Time Monitoring</h3>
                    <p className="text-sm text-gray-600">Instant updates on orders, tasks, and performance metrics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 w-full flex-col justify-center rounded-3xl bg-white p-5 shadow-xl sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3 xl:hidden">
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5">
                <ChefHat className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">RestroManagement</h1>
            </div>

            <div className="mb-6 sm:mb-8">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Welcome Back</h2>
              <p className="text-sm text-gray-600 sm:text-base">Sign in to access your role-specific dashboard</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-gray-300 py-3.5 pl-12 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-300 py-3.5 pl-12 pr-12 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => alert('Please contact administrator for password reset')}
                  className="text-sm font-medium text-cyan-600 transition-colors hover:text-cyan-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in →'
                )}
              </button>
            </form>

            <div className="mt-6 text-center sm:mt-8">
              <p className="text-sm text-gray-600">
                Need an account?{' '}
                <Link
                  to="/auth/register"
                  className="font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
                >
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold text-gray-700">Demo Credentials:</p>
              <div className="space-y-1 break-words text-xs text-gray-600">
                <p><span className="font-medium">Admin:</span> admin@restaurant.com / admin123</p>
                <p><span className="font-medium">Manager:</span> manager@restaurant.com / manager123</p>
                <p><span className="font-medium">Chef:</span> chef@restaurant.com / chef123</p>
                <p><span className="font-medium">Waiter:</span> waiter@restaurant.com / waiter123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
