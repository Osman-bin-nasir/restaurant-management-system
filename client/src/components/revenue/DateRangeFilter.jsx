import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { subDays, format } from 'date-fns';

const DateRangeFilter = ({ onDateChange, initialRange }) => {
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const handleApply = () => {
    onDateChange({ startDate, endDate });
  };

  const setPresetRange = (days) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
    onDateChange({ 
      startDate: format(start, 'yyyy-MM-dd'), 
      endDate: format(end, 'yyyy-MM-dd') 
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <span className="font-medium text-gray-700 dark:text-gray-200">Date Range</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 rounded-md border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span className="text-gray-500 dark:text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 rounded-md border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setPresetRange(7)} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Last 7 Days</button>
        <button onClick={() => setPresetRange(30)} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Last 30 Days</button>
        <button onClick={() => setPresetRange(90)} className="px-3 py-1 text-sm rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Last 90 Days</button>
      </div>

      <button
        onClick={handleApply}
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
      >
        Apply
      </button>
    </div>
  );
};

export default DateRangeFilter;
