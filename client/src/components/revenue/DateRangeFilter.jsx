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
    const newStartDate = format(start, 'yyyy-MM-dd');
    const newEndDate = format(end, 'yyyy-MM-dd');
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    onDateChange({ 
      startDate: newStartDate, 
      endDate: newEndDate 
    });
  };

  const setAllTime = () => {
    setStartDate('');
    setEndDate('');
    onDateChange({ startDate: null, endDate: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <span className="font-medium text-gray-700">Date Range</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 rounded-md border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 rounded-md border bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setPresetRange(7)} className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors">Last 7 Days</button>
        <button onClick={() => setPresetRange(30)} className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors">Last 30 Days</button>
        <button onClick={() => setPresetRange(90)} className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors">Last 90 Days</button>
        <button onClick={setAllTime} className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors">All Time</button>
      </div>

      <button
        onClick={handleApply}
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
      >
        Apply
      </button>
    </div>
  );
};

export default DateRangeFilter;
