
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border rounded-md shadow-md">
        <p className="label">{`${label} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

const RevenueGraphs = ({ dailyData, monthlyData, yearlyData, trendsData, comparisonData }) => {
  const comparisonChartData = [
    {
      name: 'Revenue',
      current: comparisonData?.current?.revenue,
      previous: comparisonData?.previous?.revenue,
    },
    {
      name: 'Orders',
      current: comparisonData?.current?.orders,
      previous: comparisonData?.previous?.orders,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Total Earnings Over Time */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Total Earnings Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData?.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke={COLORS[0]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Most Sold Products */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Most Sold Products</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData?.topSellingItems}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="quantity" fill={COLORS[1]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Customer Activity */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Peak Customer Activity (Hourly)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyData?.breakdown?.byHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="orders" fill={COLORS[2]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Product Category */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Revenue by Product Category</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={yearlyData?.categoryPerformance}
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
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Net Profit Over Time */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Net Profit Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendsData?.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="netProfit" stroke={COLORS[3]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Comparison */}
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{`${comparisonData?.period.charAt(0).toUpperCase() + comparisonData?.period.slice(1)} Revenue Comparison`}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="current" fill={COLORS[4]} />
            <Bar dataKey="previous" fill={COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueGraphs;
