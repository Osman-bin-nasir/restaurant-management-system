import { useState, useEffect, useCallback } from 'react';
import { subDays, format } from 'date-fns';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';

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
      const params = {};
      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }

      const [summaryRes, parcelRes] = await Promise.all([
        api.get('/revenue/summary', {
          headers: { Authorization: `Bearer ${user.token}` },
          params,
        }),
        api.get('/parcel', {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { ...params, limit: 1 }, // We only need stats, so limit to 1
        }),
      ]);

      const summaryData = summaryRes.data;
      const parcelStats = parcelRes.data.stats;

      if (summaryData && parcelStats) {
        summaryData.kpis.totalRevenue = (summaryData.kpis.totalRevenue || 0) + (parcelStats.totalRevenue || 0);
        summaryData.kpis.totalOrders = (summaryData.kpis.totalOrders || 0) + (parcelStats.total || 0);
      }

      setData(summaryData);
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

  const kpiData = [
    { title: 'Total Revenue', value: data?.kpis.totalRevenue, icon: DollarSign, color: 'text-green-500' },
    { title: 'Net Profit', value: data?.kpis.netProfit, icon: TrendingUp, color: 'text-blue-500' },
    { title: 'Total Expenses', value: data?.kpis.totalExpenses, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Total Orders', value: data?.kpis.totalOrders, formatAsCurrency: false, icon: ShoppingCart, color: 'text-yellow-500' },
  ];

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Revenue Dashboard</h1>
          <p className="text-gray-500">An overview of your business's financial performance.</p>
        </div>
      </header>

      <DateRangeFilter onDateChange={setDateRange} initialRange={dateRange} />

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader />
        </div>
      ) : error ? (
        <div className="p-6 my-6 bg-red-100 rounded-lg text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-semibold text-red-800">Loading Failed</h3>
          <p className="mt-1 text-red-600">{error}</p>
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
          <ProfitTrendChart data={data.trends.profitTrend} />

          {/* Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <BreakdownPieChart data={data.breakdowns.paymentMethods} />
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
