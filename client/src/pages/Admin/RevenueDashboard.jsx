import React, { useState, useEffect } from 'react';
import RevenueGraphs from '../../components/RevenueGraphs';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import Loader from '../../components/Loader';

const RevenueDashboard = () => {
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [comparisonPeriod, setComparisonPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dailyRes, monthlyRes, yearlyRes, trendsRes, comparisonRes] = await Promise.all([
          api.get('/revenue/daily', { headers: { Authorization: `Bearer ${user.token}` } }),
          api.get('/revenue/monthly', { headers: { Authorization: `Bearer ${user.token}` } }),
          api.get('/revenue/yearly', { headers: { Authorization: `Bearer ${user.token}` } }),
          api.get('/revenue/trends', { headers: { Authorization: `Bearer ${user.token}` } }),
          api.get(`/revenue/comparison?period=${comparisonPeriod}`, { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setDailyData(dailyRes.data);
        setMonthlyData(monthlyRes.data);
        setYearlyData(yearlyRes.data);
        setTrendsData(trendsRes.data);
        setComparisonData(comparisonRes.data);
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setError('Failed to fetch revenue data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user?.token, comparisonPeriod]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Revenue Dashboard</h1>
        <select
          value={comparisonPeriod}
          onChange={(e) => setComparisonPeriod(e.target.value)}
          className="p-2 rounded-md border"
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <RevenueGraphs
        dailyData={dailyData}
        monthlyData={monthlyData}
        yearlyData={yearlyData}
        trendsData={trendsData}
        comparisonData={comparisonData}
      />
    </div>
  );
};

export default RevenueDashboard;
