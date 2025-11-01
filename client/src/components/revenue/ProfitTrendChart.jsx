import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
        <p className="label font-bold text-gray-800">{format(new Date(label), 'PPP')}</p>
        <p className="intro text-green-500">{`Revenue: ${payload[0].value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`}</p>
        <p className="intro text-red-500">{`Expenses: ${payload[1].value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`}</p>
        <p className="intro text-blue-500">{`Profit: ${(payload[0].value - payload[1].value).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`}</p>
      </div>
    );
  }
  return null;
};

const ProfitTrendChart = ({ data }) => {
  return (
    <div className="h-96 bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue & Profit Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => format(new Date(str), 'MMM d')} 
                    stroke={'#4b5563'}
                />
                <YAxis 
                    tickFormatter={(val) => `₹${val / 1000}k`} 
                    stroke={'#4b5563'}
                />
                <CartesianGrid strokeDasharray="3 3" stroke={"#e5e7eb"} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};

export default ProfitTrendChart;
