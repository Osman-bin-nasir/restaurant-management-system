import express from 'express';

import { getDashboardSummary } from '../controllers/dashboardController.js';
import userAuth from '../middleware/userAuth.js';
import { authorizePermissions } from '../middleware/authorize.js';
import { requireBranch } from '../middleware/branchAccess.js';
import { preventDashboardCaching } from '../services/dashboardService.js';

const router = express.Router();

router.get(
  '/summary',
  userAuth,
  authorizePermissions('orders:view'),
  authorizePermissions('tables:view'),
  requireBranch,
  preventDashboardCaching,
  getDashboardSummary,
);

export default router;
