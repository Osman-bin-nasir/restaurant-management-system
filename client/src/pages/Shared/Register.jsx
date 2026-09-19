import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ChefHat, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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
      await register(formData.name, formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Register error:', err);
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
                  Create Your Staff Account
                </h2>
                <p className="text-lg leading-relaxed text-gray-600">
                  Join the restaurant team and get role-specific tools for orders, tables, kitchen, and billing.
                </p>
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
              <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Create Account</h2>
              <p className="text-sm text-gray-600 sm:text-base">Sign up to access your role-specific dashboard</p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    autoComplete="name"
                    className="w-full rounded-xl border border-gray-300 py-3.5 pl-12 pr-4 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

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
                    placeholder="Create a password"
                    autoComplete="new-password"
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
                    Creating account...
                  </span>
                ) : (
                  'Sign up →'
                )}
              </button>
            </form>

            <div className="mt-6 text-center sm:mt-8">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-cyan-600 transition-colors hover:text-cyan-700"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
