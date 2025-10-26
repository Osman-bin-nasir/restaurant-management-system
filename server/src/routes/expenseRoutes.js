import express from 'express';
import {
  getAllExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController.js';
import userAuth from '../middleware/userAuth.js';
import { authorizePermissions } from '../middleware/authorize.js';
import { requireBranch } from '../middleware/branchAccess.js';

const router = express.Router();

// All routes in this file are protected and require a user to be authenticated
// and have a branch assigned.
router.use(userAuth, requireBranch);

router
  .route('/')
  .get(authorizePermissions('reports:view'), getAllExpenses) // Re-using existing permission
  .post(authorizePermissions('reports:view'), createExpense);

router
  .route('/:id')
  .get(authorizePermissions('reports:view'), getExpenseById)
  .put(authorizePermissions('reports:view'), updateExpense)
  .delete(authorizePermissions('reports:view'), deleteExpense);

export default router;
