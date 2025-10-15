import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:3000/api';

const apiCall = async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Request failed');
  return result;
};

const AuthPages = () => {
  const [theme, setTheme] = useState('light');
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = location.pathname === '/login';

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      try {
        const res = await apiCall('/auth/login', formData);
        if (res.success) {
          alert('Login successful!');
          window.location.href = '/menu';
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            className={`${
              theme === 'light'
                ? 'bg-red-50 text-red-600'
                : 'bg-red-900/30 text-red-300 border border-red-700'
            } px-4 py-3 rounded-lg text-sm`}
          >
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className={`w-full px-5 py-3.5 rounded-full border-2 transition-colors ${
            theme === 'light'
              ? 'border-blue-200 focus:border-blue-500'
              : 'bg-transparent border-purple-500 text-white placeholder-gray-400 focus:border-purple-400'
          }`}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={`w-full px-5 py-3.5 rounded-full border-2 transition-colors ${
            theme === 'light'
              ? 'border-blue-200 focus:border-blue-500'
              : 'bg-transparent border-purple-500 text-white placeholder-gray-400 focus:border-purple-400'
          }`}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-full font-semibold transition-all disabled:opacity-50 ${
            theme === 'light'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white'
          }`}
        >
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        <p className="text-center text-sm mt-2">
          Don’t have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Register
          </span>
        </p>
      </form>
    );
  };

  const Register = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      roleName: 'waiter',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError('');
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setLoading(true);
      try {
        const res = await apiCall('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roleName: formData.roleName,
        });
        if (res.success) {
          alert('Registration successful! Please verify your email.');
          navigate('/login');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            className={`${
              theme === 'light'
                ? 'bg-red-50 text-red-600'
                : 'bg-red-900/30 text-red-300 border border-red-700'
            } px-4 py-3 rounded-lg text-sm`}
          >
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          className={`w-full px-5 py-3.5 rounded-full border-2 transition-colors ${
            theme === 'light'
              ? 'border-blue-200 focus:border-blue-500'
              : 'bg-transparent border-purple-500 text-white placeholder-gray-400 focus:border-purple-400'
          }`}
          required
        />

        <input
          type="email"
          placeholder="E-mail"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          className={`w-full px-5 py-3.5 rounded-full border-2 transition-colors ${
            theme === 'light'
              ? 'border-blue-200 focus:border-blue-500'
              : 'bg-transparent border-purple-500 text-white placeholder-gray-400 focus:border-purple-400'
          }`}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          className={`w-full px-5 py-3.5 rounded-full border-2 transition-colors ${
            theme === 'light'
              ? 'border-blue-200 focus:border-blue-500'
              : 'bg-transparent border-purple-500 text-white placeholder-gray-400 focus:border-purple-400'
          }`}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          className={`w-full px-5 py-3.5 rounded-full border-2 transition-colors ${
            theme === 'light'
              ? 'border-blue-200 focus:border-blue-500'
              : 'bg-transparent border-purple-500 text-white placeholder-gray-400 focus:border-purple-400'
          }`}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-full font-semibold transition-all disabled:opacity-50 ${
            theme === 'light'
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {loading ? 'Registering...' : 'REGISTER'}
        </button>

        <p className="text-center text-sm mt-2">
          Already have an account?{' '}
          <span
            onClick={() => navigate('/login')}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </form>
    );
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 transition-all duration-300 ${
        theme === 'light'
          ? 'bg-gradient-to-br from-gray-100 to-gray-200'
          : 'bg-gradient-to-br from-gray-900 to-black'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-3xl shadow-2xl p-10 transition-all ${
          theme === 'light'
            ? 'bg-white text-gray-800'
            : 'bg-gray-900 text-white'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2
            className={`text-3xl font-bold ${
              theme === 'light' ? 'text-blue-600' : 'text-purple-400'
            }`}
          >
            {isLogin ? 'Login' : 'Register'}
          </h2>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-full hover:opacity-80 transition"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>

        {isLogin ? <Login /> : <Register />}
      </div>
    </div>
  );
};

export default AuthPages;
