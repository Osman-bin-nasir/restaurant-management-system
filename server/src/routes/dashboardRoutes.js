import express from 'express';

import { getDashboardSummary } from '../controllers/dashboardController.js';
import userAuth from '../middleware/userAuth.js';
import { authorizePermissions } from '../middleware/authorize.js';
import { requireBranch } from '../middleware/branchAccess.js';

const router = express.Router();

router.get(
  '/summary',
  userAuth,
  authorizePermissions('orders:view'),
  authorizePermissions('tables:view'),
  requireBranch,
  getDashboardSummary,
);

export default router;
