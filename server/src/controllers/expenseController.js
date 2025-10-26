import Expense from '../models/Expense.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import CustomError from '../utils/customError.js';
import mongoose from 'mongoose';

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin
export const getAllExpenses = asyncHandler(async (req, res) => {
  const { branchId } = req.user;
  const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc', category, startDate, endDate } = req.query;

  const filter = { branchId: new mongoose.Types.ObjectId(branchId) };

  if (category) {
    filter.category = category;
  }

  if (startDate && endDate) {
    filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const expenses = await Expense.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate('approvedBy', 'name');

  const total = await Expense.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: expenses.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: expenses,
  });
});

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private/Admin
export const createExpense = asyncHandler(async (req, res) => {
  const { category, amount, description, date } = req.body;
  const { branchId, _id: userId } = req.user;

  if (!category || !amount || !date) {
    throw new CustomError('Please provide category, amount, and date', 400);
  }

  const expense = await Expense.create({
    category,
    amount,
    description,
    date,
    branchId,
    approvedBy: userId,
  });

  res.status(201).json({ success: true, data: expense });
});

// @desc    Get a single expense
// @route   GET /api/expenses/:id
// @access  Private/Admin
export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('approvedBy', 'name');

  if (!expense || expense.branchId.toString() !== req.user.branchId.toString()) {
    throw new CustomError(`Expense not found with id of ${req.params.id}`, 404);
  }

  res.status(200).json({ success: true, data: expense });
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private/Admin
export const updateExpense = asyncHandler(async (req, res) => {
  let expense = await Expense.findById(req.params.id);

  if (!expense || expense.branchId.toString() !== req.user.branchId.toString()) {
    throw new CustomError(`Expense not found with id of ${req.params.id}`, 404);
  }

  expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: expense });
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense || expense.branchId.toString() !== req.user.branchId.toString()) {
    throw new CustomError(`Expense not found with id of ${req.params.id}`, 404);
  }

  await expense.deleteOne();

  res.status(200).json({ success: true, data: {} });
});
