// backend/src/routes/approvalWorkflow.js
const express = require('express');
const router = express.Router();
const approvalWorkflowController = require('../controllers/approvalWorkflowController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// List pending approvals
router.get(
  '/pending',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'APPROVER'),
  approvalWorkflowController.listPendingApprovals
);

// Create/update workflow
router.post(
  '/workflow',
  roleMiddleware('ADMIN', 'ACCOUNTANT'),
  approvalWorkflowController.createOrUpdateWorkflow
);

// List all workflows
router.get(
  '/workflows',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'APPROVER'),
  approvalWorkflowController.listWorkflows
);

// Submit document for approval
router.post(
  '/submit',
  roleMiddleware('ADMIN', 'ACCOUNTANT'),
  approvalWorkflowController.submitForApproval
);

// Approve or reject
router.post(
  '/:workflowInstanceId/decision',
  roleMiddleware('ADMIN', 'ACCOUNTANT', 'APPROVER'),
  approvalWorkflowController.takeDecision
);

module.exports = router;