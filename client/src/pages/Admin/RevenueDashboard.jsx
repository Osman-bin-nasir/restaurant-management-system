import { useState, useEffect, useCallback } from 'react';
import { subDays, format } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { FaSun, FaMoon } from 'react-icons/fa';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, BarChart2 } from 'lucide-react';

// Import new components
import DateRangeFilter from '../../components/revenue/DateRangeFilter';
import KPIWidget from '../../components/revenue/KPIWidget';
import ProfitTrendChart from '../../components/revenue/ProfitTrendChart';
import BreakdownPieChart from '../../components/revenue/BreakdownPieChart';
import TopItemsTable from '../../components/revenue/TopItemsTable';
import Loader from '../../components/Loader';

const RevenueDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 29);
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };
      const response = await api.get('/revenue/summary', {
        headers: { Authorization: `Bearer ${user.token}` },
        params,
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching revenue summary:', err);
      setError(err.response?.data?.message || 'Failed to fetch revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.token, dateRange]);

  useEffect(() => {
    if (user?.token) {
      fetchData();
    }
  }, [fetchData, user?.token]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const kpiData = [
    { title: 'Total Revenue', value: data?.kpis.totalRevenue, icon: DollarSign, color: 'text-green-500' },
    { title: 'Net Profit', value: data?.kpis.netProfit, icon: TrendingUp, color: 'text-blue-500' },
    { title: 'Total Expenses', value: data?.kpis.totalExpenses, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Total Orders', value: data?.kpis.totalOrders, formatAsCurrency: false, icon: ShoppingCart, color: 'text-yellow-500' },
  ];

  return (
    <div className={`p-4 sm:p-6 min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Revenue Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">An overview of your business's financial performance.</p>
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
        </button>
      </header>

      <DateRangeFilter onDateChange={setDateRange} initialRange={dateRange} />

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader />
        </div>
      ) : error ? (
        <div className="p-6 my-6 bg-red-100 dark:bg-red-900/20 rounded-lg text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-semibold text-red-800 dark:text-red-300">Loading Failed</h3>
          <p className="mt-1 text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : data ? (
        <main className="mt-6 grid grid-cols-1 gap-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiData.map(kpi => <KPIWidget key={kpi.title} {...kpi} />)}
          </div>

          {/* Main Chart */}
          <ProfitTrendChart data={data.trends.profitTrend} isDarkMode={isDarkMode} />

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <BreakdownPieChart data={data.breakdowns.paymentMethods} isDarkMode={isDarkMode} />
            </div>
            <div className="lg:col-span-2">
              <TopItemsTable data={data.breakdowns.topItems} />
            </div>
          </div>
        </main>
      ) : null}
    </div>
  );
};

export default RevenueDashboard;
