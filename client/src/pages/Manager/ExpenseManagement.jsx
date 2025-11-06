import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ExpenseModal = ({ isOpen, onClose, onSave, expense }) => {
  const formatLocalDate = (date) => {
    const local = new Date(date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' });
    return local.split(',')[0];
  };

  const [amount, setAmount] = useState(expense ? expense.amount : '');
  const [category, setCategory] = useState(expense ? expense.category : 'Groceries');
  const [date, setDate] = useState(expense ? formatLocalDate(expense.date) : formatLocalDate(new Date()));
  const [description, setDescription] = useState(expense ? expense.description : '');

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount);
      setCategory(expense.category);
      setDate(formatLocalDate(expense.date));
      setDescription(expense.description);
    } else {
      setAmount('');
      setCategory('Groceries');
      setDate(formatLocalDate(new Date()));
      setDescription('');
    }
  }, [expense]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({ amount, category, date, description, _id: expense?._id });
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-100 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-100 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            >
              <option>Groceries</option>
              <option>Utilities</option>
              <option>Salaries</option>
              <option>Maintenance</option>
              <option>Marketing</option>
              <option>Supplies</option>
              <option>Rent</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-100 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 mt-1 bg-gray-100 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300">
            Cancel
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const { user } = useAuth();

  const fetchExpenses = useCallback(
    async (currentPage) => {
      if (currentPage === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const { data } = await api.get(`/expenses?page=${currentPage}&limit=10`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setExpenses(prev => (currentPage === 1 ? data.data : [...prev, ...data.data]));
        setHasMore(data.currentPage < data.totalPages);
      } catch (error) {
        toast.error('Failed to fetch expenses.');
        console.error(error);
      } finally {
        if (currentPage === 1) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [user.token]
  );

  useEffect(() => {
    fetchExpenses(1);
  }, [fetchExpenses]);

  // ✅ Infinite Scroll Setup
  const observer = useRef();
  const lastExpenseRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchExpenses(nextPage);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, page, fetchExpenses]
  );

  const handleSave = async (expenseData) => {
    try {
      if (expenseData._id) {
        await api.put(`/expenses/${expenseData._id}`, expenseData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        toast.success('Expense updated successfully!');
      } else {
        await api.post('/expenses', expenseData, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        toast.success('Expense added successfully!');
      }
      setPage(1);
      fetchExpenses(1);
    } catch (error) {
      toast.error('Failed to save expense.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        toast.success('Expense deleted successfully!');
        setPage(1);
        fetchExpenses(1);
      } catch (error) {
        toast.error('Failed to delete expense.');
        console.error(error);
      }
    }
  };

  const openModal = (expense = null) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const formatISTDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Expense Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-600">Date</th>
              <th className="p-4 text-left font-semibold text-gray-600">Category</th>
              <th className="p-4 text-left font-semibold text-gray-600">Description</th>
              <th className="p-4 text-right font-semibold text-gray-600">Amount</th>
              <th className="p-4 text-center font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center p-8 text-gray-500">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            ) : (
              expenses.map((exp, index) => (
                <tr
                  key={exp._id}
                  ref={index === expenses.length - 1 ? lastExpenseRef : null}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-4 text-gray-700">{formatISTDate(exp.date)}</td>
                  <td className="p-4 text-gray-700">{exp.category}</td>
                  <td className="p-4 text-gray-600">{exp.description}</td>
                  <td className="p-4 text-right text-gray-800 font-medium">
                    {exp.amount.toLocaleString('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                    })}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openModal(exp)}
                      className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-100"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(exp._id)}
                      className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {loadingMore && (
          <div className="p-4 text-center border-t border-gray-200">
            <Loader2 className="animate-spin mx-auto text-gray-500" size={24} />
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        expense={selectedExpense}
      />
    </div>
  );
};

export default ExpenseManagement;
