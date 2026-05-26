// backend/src/controllers/approvalWorkflowController.js
const db = require('../config/db');
const { ApprovalWorkflow, ApprovalInstance, Invoice, Payment, JournalEntry } = db;
const { Op } = db.Sequelize;

// GET /api/approval-workflow/pending - List all pending approvals with details
exports.listPendingApprovals = async (req, res, next) => {
  try {
    const instances = await ApprovalInstance.findAll({
      where: { status: 'PENDING' },
      order: [['createdAt', 'DESC']]
    });

    // Fetch details for each document
    const rows = await Promise.all(instances.map(async (inst) => {
      let documentDetails = {
        documentNumber: inst.documentId.toString(),
        partyName: null,
        accountName: null,
        amount: inst.amount || 0,
        date: inst.createdAt,
        narration: inst.remarks || '',
        createdByName: 'Unknown'
      };

      // Fetch actual document details based on type
      try {
        switch (inst.documentType) {
          case 'INVOICE': {
            const invoice = await Invoice.findByPk(inst.documentId);
            if (invoice) {
              documentDetails = {
                documentNumber: invoice.invoiceNumber,
                partyName: invoice.partyName,
                accountName: null,
                amount: invoice.totalAmount || inst.amount,
                date: invoice.date,
                narration: invoice.narration || '',
                createdByName: invoice.createdByName || 'Unknown'
              };
            }
            break;
          }
          case 'PAYMENT': {
            const payment = await Payment.findByPk(inst.documentId);
            if (payment) {
              documentDetails = {
                documentNumber: payment.paymentNumber,
                partyName: payment.partyName,
                accountName: payment.accountName,
                amount: payment.amount || inst.amount,
                date: payment.date,
                narration: payment.narration || '',
                createdByName: payment.createdByName || 'Unknown'
              };
            }
            break;
          }
          case 'JOURNAL': {
            const journal = await JournalEntry.findByPk(inst.documentId);
            if (journal) {
              documentDetails = {
                documentNumber: journal.journalNumber || `JV-${inst.documentId}`,
                partyName: null,
                accountName: journal.accountName,
                amount: journal.totalAmount || inst.amount,
                date: journal.date,
                narration: journal.narration || '',
                createdByName: journal.createdByName || 'Unknown'
              };
            }
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error(`Error fetching details for ${inst.documentType} ${inst.documentId}:`, err);
      }

      return {
        id: inst.id,
        documentType: inst.documentType,
        documentId: inst.documentId,
        documentNumber: documentDetails.documentNumber,
        partyName: documentDetails.partyName,
        accountName: documentDetails.accountName,
        amount: documentDetails.amount,
        date: documentDetails.date,
        narration: documentDetails.narration,
        createdByName: documentDetails.createdByName,
        status: inst.status,
        currentLevel: inst.currentLevel,
        createdAt: inst.createdAt
      };
    }));

    res.json(rows);
  } catch (err) {
    console.error('Error listing pending approvals:', err);
    next(err);
  }
};

// POST /api/approval-workflow/workflow - Create or update workflow
exports.createOrUpdateWorkflow = async (req, res, next) => {
  try {
    const { documentType, levels, active } = req.body;

    if (!documentType || !levels || !Array.isArray(levels)) {
      return res.status(400).json({ message: 'Invalid workflow data' });
    }

    const [workflow, created] = await ApprovalWorkflow.upsert({
      documentType,
      levels: levels,
      active: active !== false
    });

    res.status(201).json({
      workflow,
      created,
      message: created ? 'Workflow created' : 'Workflow updated'
    });
  } catch (err) {
    console.error('Error creating/updating workflow:', err);
    next(err);
  }
};

// GET /api/approval-workflow/workflows - List all workflows
exports.listWorkflows = async (req, res, next) => {
  try {
    const workflows = await ApprovalWorkflow.findAll({
      order: [['documentType', 'ASC']]
    });

    // Parse levels JSON if stored as string
    const parsed = workflows.map(wf => {
      const wfJson = wf.toJSON();
      if (typeof wfJson.levels === 'string') {
        wfJson.levels = JSON.parse(wfJson.levels);
      }
      return wfJson;
    });

    res.json(parsed);
  } catch (err) {
    console.error('Error listing workflows:', err);
    next(err);
  }
};

// POST /api/approval-workflow/submit - Submit document for approval
exports.submitForApproval = async (req, res, next) => {
  try {
    const { documentType, documentId, amount } = req.body;

    if (!documentType || !documentId) {
      return res.status(400).json({ message: 'Document type and ID are required' });
    }

    // Check if workflow exists and is active
    const workflow = await ApprovalWorkflow.findOne({
      where: { documentType, active: true }
    });

    if (!workflow) {
      return res.status(400).json({ 
        message: `No active workflow configured for ${documentType}` 
      });
    }

    // Check if document is already pending approval
    const existing = await ApprovalInstance.findOne({
      where: {
        documentType,
        documentId,
        status: 'PENDING'
      }
    });

    if (existing) {
      return res.status(400).json({ 
        message: 'This document is already pending approval' 
      });
    }

    const instance = await ApprovalInstance.create({
      documentType,
      documentId,
      amount: amount || 0,
      status: 'PENDING',
      currentLevel: 1,
      workflowId: workflow.id,
      createdBy: req.user.id
    });

    res.status(201).json({
      ...instance.toJSON(),
      message: 'Document submitted for approval successfully'
    });
  } catch (err) {
    console.error('Error submitting for approval:', err);
    next(err);
  }
};

// POST /api/approval-workflow/:workflowInstanceId/decision - Approve or reject
exports.takeDecision = async (req, res, next) => {
  try {
    const { workflowInstanceId } = req.params;
    const { decision, remarks } = req.body;

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      return res.status(400).json({ 
        message: 'Invalid decision. Use APPROVE or REJECT' 
      });
    }

    const instance = await ApprovalInstance.findByPk(workflowInstanceId);
    
    if (!instance) {
      return res.status(404).json({ message: 'Workflow instance not found' });
    }

    if (instance.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `Document is already ${instance.status.toLowerCase()}` 
      });
    }

    // Update instance
    instance.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    instance.remarks = remarks || null;
    instance.approvedBy = req.user.id;
    instance.approvedAt = new Date();
    await instance.save();

    // If approved, update the actual document status
    if (decision === 'APPROVE') {
      try {
        switch (instance.documentType) {
          case 'INVOICE': {
            await Invoice.update(
              { status: 'APPROVED' },
              { where: { id: instance.documentId } }
            );
            break;
          }
          case 'PAYMENT': {
            await Payment.update(
              { status: 'APPROVED' },
              { where: { id: instance.documentId } }
            );
            break;
          }
          case 'JOURNAL': {
            await JournalEntry.update(
              { status: 'APPROVED' },
              { where: { id: instance.documentId } }
            );
            break;
          }
          default:
            break;
        }
      } catch (updateErr) {
        console.error('Error updating document status:', updateErr);
      }
    }

    res.json({
      ...instance.toJSON(),
      message: `Document ${decision.toLowerCase()}d successfully`
    });
  } catch (err) {
    console.error('Error taking decision:', err);
    next(err);
  }
};