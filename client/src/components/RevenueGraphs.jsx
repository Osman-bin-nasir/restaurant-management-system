import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const CustomTooltip = ({ active, payload, label, isDarkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} border rounded-lg shadow-lg`}>
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueGraphs = ({ dailyData, monthlyData, yearlyData, trendsData, comparisonData, forecastData, isDarkMode }) => {
  const comparisonChartData = comparisonData
    ? [
        {
          name: 'Revenue',
          current: comparisonData?.current?.revenue ?? 0,
          previous: comparisonData?.previous?.revenue ?? 0,
        },
        {
          name: 'Orders',
          current: comparisonData?.current?.orders ?? 0,
          previous: comparisonData?.previous?.orders ?? 0,
        },
      ]
    : [];

  const tickColor = isDarkMode ? '#A0AEC0' : '#4A5568';
  const gridColor = isDarkMode ? '#4A5568' : '#E2E8F0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Total Earnings Over Time */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Total Earnings Over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData?.trends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Line type="monotone" dataKey="revenue" stroke={COLORS[0]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Most Sold Products */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Most Sold Products
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData?.topSellingItems || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Bar dataKey="quantity" fill={COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Customer Activity */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Peak Customer Activity (Hourly)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData?.breakdown?.byHour || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="hour" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Bar dataKey="orders" fill={COLORS[2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Product Category */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Revenue by Product Category
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={yearlyData?.categoryPerformance || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="revenue"
            >
              {yearlyData?.categoryPerformance?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Net Profit Over Time */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Net Profit Over Time
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData?.trends || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Line type="monotone" dataKey="netProfit" stroke={COLORS[3]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Comparison */}
      <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          {`${comparisonData?.period.charAt(0).toUpperCase() + (comparisonData?.period.slice(1) || '')} Revenue Comparison`}
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Bar dataKey="current" fill={COLORS[4]} />
            <Bar dataKey="previous" fill={COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Forecast */}
      <div className={`p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
          Revenue Forecast (Next 30 Days)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecastData || []}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fill: tickColor }} />
            <YAxis tick={{ fill: tickColor }} />
            <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
            <Area type="monotone" dataKey="predictedRevenue" stroke={COLORS[0]} fillOpacity={1} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueGraphs;