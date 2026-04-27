import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ChefHat } from 'lucide-react';
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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Section - Info Card */}
        <div className="bg-white rounded-3xl shadow-xl p-12 lg:p-16 order-2 lg:order-1 h-full flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl">
              <ChefHat className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">RestroManagement</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Manage Every Role Seamlessly
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                A unified platform for all restaurant staff — from Admins and Managers to Chefs and Waiters.
                Access role-specific dashboards to simplify daily operations, enhance coordination, and deliver
                better dining experiences.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="bg-cyan-100 p-2 rounded-lg mt-1">
                  <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Role-Based Access</h3>
                  <p className="text-gray-600 text-sm">Admins, managers, chefs, and waiters each have tailored tools and permissions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-cyan-100 p-2 rounded-lg mt-1">
                  <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Collaborative Workflow</h3>
                  <p className="text-gray-600 text-sm">Seamless coordination between kitchen, service, and management</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-cyan-100 p-2 rounded-lg mt-1">
                  <svg className="w-5 h-5 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-Time Monitoring</h3>
                  <p className="text-gray-600 text-sm">Instant updates on orders, tasks, and performance metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 order-1 lg:order-2 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to access your role-specific dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSubmit(e);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSubmit(e);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={() => alert('Please contact administrator for password reset')}
                className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in →'
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Need access?{' '}
              <button
                onClick={() => alert('Please contact your administrator for account access')}
                className="font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
              >
                Contact Administrator
              </button>
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Demo Credentials</p>
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-medium">Password:</span> 123456
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="font-medium">Admin:</span> admin@restaurant.com</p>
              <p><span className="font-medium">Manager:</span> manager@restaurant.com</p>
              <p><span className="font-medium">Cashier:</span> cashier@restaurant.com</p>
              <p><span className="font-medium">Waiter:</span> waiter@restaurant.com / waiter2@restaurant.com</p>
              <p><span className="font-medium">Chef:</span> chef@restaurant.com / chef2@restaurant.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
