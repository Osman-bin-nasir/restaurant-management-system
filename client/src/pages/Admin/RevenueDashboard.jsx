import React, { useState, useEffect, useCallback } from 'react';
import RevenueGraphs from '../../components/RevenueGraphs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Loader from '../../components/Loader';
import { FaSun, FaMoon, FaSync } from 'react-icons/fa';
import { ErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
    <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
    >
      Try Again
    </button>
  </div>
);

const RevenueDashboard = () => {
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [comparisonPeriod, setComparisonPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const [dailyRes, monthlyRes, yearlyRes, trendsRes, comparisonRes, kpisRes, forecastRes] = await Promise.all([
        api.get('/revenue/daily', { headers: { Authorization: `Bearer ${user.token}` } }),
        api.get('/revenue/monthly', { headers: { Authorization: `Bearer ${user.token}` } }),
        api.get('/revenue/yearly', { headers: { Authorization: `Bearer ${user.token}` } }),
        api.get('/revenue/trends', { headers: { Authorization: `Bearer ${user.token}` } }),
        api.get(`/revenue/comparison?period=${comparisonPeriod}`, { headers: { Authorization: `Bearer ${user.token}` } }),
        api.get(`/revenue/kpis?startDate=${startDate}&endDate=${endDate}`, { headers: { Authorization: `Bearer ${user.token}` } }),
        api.get('/revenue/forecast', { headers: { Authorization: `Bearer ${user.token}` } })
      ]);

      setDailyData(dailyRes.data);
      setMonthlyData(monthlyRes.data);
      setYearlyData(yearlyRes.data);
      setTrendsData(trendsRes.data);
      setComparisonData(comparisonRes.data);
      setKpis(kpisRes.data.kpis);
      setForecastData(forecastRes.data.forecast);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError('Failed to fetch revenue data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user?.token, comparisonPeriod]);

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [user?.token, comparisonPeriod, fetchData]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
        <button
          onClick={handleRefresh}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpiData = [
    { title: 'Total Revenue', value: kpis?.totalRevenue ? `$${kpis.totalRevenue.toFixed(2)}` : 'N/A' },
    { title: 'Total Orders', value: kpis?.totalOrders ?? 'N/A' },
    { title: 'Average Order Value', value: kpis?.averageOrderValue ? `$${kpis.averageOrderValue.toFixed(2)}` : 'N/A' },
    { title: 'Total Customers', value: kpis?.totalCustomers ?? 'N/A' },
  ];

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={fetchData}>
      <div className={`p-6 min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Revenue Dashboard</h1>
          <div className="flex items-center space-x-4">
            <select
              value={comparisonPeriod}
              onChange={(e) => setComparisonPeriod(e.target.value)}
              className="p-2 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title="Refresh Data"
            >
              <FaSync className={`${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiData.map((kpi, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.title}</h3>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
            </div>
          ))}
        </div>

        <RevenueGraphs
          dailyData={dailyData}
          monthlyData={monthlyData}
          yearlyData={yearlyData}
          trendsData={trendsData}
          comparisonData={comparisonData}
          forecastData={forecastData}
          isDarkMode={isDarkMode}
        />
      </div>
    </ErrorBoundary>
  );
};

export default RevenueDashboard;