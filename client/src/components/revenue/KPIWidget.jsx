import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const KPIWidget = ({ title, value, previousValue, formatAsCurrency = true }) => {
  const formatValue = (val) => {
    if (val === null || val === undefined) return 'N/A';
    if (formatAsCurrency) {
      return val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    }
    return val.toLocaleString('en-IN');
  };

  const getChange = () => {
    if (previousValue === null || previousValue === undefined || value === null || value === undefined) {
      return { percentage: null, direction: 'neutral' };
    }
    if (previousValue === 0) {
      return { percentage: value > 0 ? 100 : 0, direction: value > 0 ? 'up' : 'neutral' };
    }
    const percentage = ((value - previousValue) / previousValue) * 100;
    const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
    return { percentage: Math.abs(percentage).toFixed(1), direction };
  };

  const { percentage, direction } = getChange();

  const changeColor = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-500',
  };

  const ChangeIcon = {
    up: ArrowUp,
    down: ArrowDown,
    neutral: Minus,
  };

  const Icon = ChangeIcon[direction];

  return (
    <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <h3 className="text-md font-medium text-gray-500 truncate">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">{formatValue(value)}</p>
      {percentage !== null && (
        <div className={`flex items-center mt-2 text-sm ${changeColor[direction]}`}>
          <Icon className="h-4 w-4 mr-1" />
          <span>{percentage}%</span>
          <span className="ml-1 text-gray-500">vs prev. period</span>
        </div>
      )}
    </div>
  );
};

export default KPIWidget;
