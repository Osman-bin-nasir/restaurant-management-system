import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

const COLORS = { 
  card: '#3b82f6', 
  cash: '#10b981', 
  upi: '#f97316', 
  other: '#6b7280' 
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg">
        <p className="label text-gray-800 dark:text-white">
          {`${payload[0].name}: ${payload[0].value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} (${payload[0].payload.percent}%)`}
        </p>
      </div>
    );
  }
  return null;
};

const BreakdownPieChart = ({ data, isDarkMode }) => {
  const total = data.reduce((sum, entry) => sum + entry.total, 0);
  const chartData = data.map(entry => ({
    name: entry._id.charAt(0).toUpperCase() + entry._id.slice(1),
    value: entry.total,
    percent: ((entry.total / total) * 100).toFixed(0)
  }));

  return (
    <div className="h-80 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Payment Methods</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || COLORS.other} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BreakdownPieChart;
