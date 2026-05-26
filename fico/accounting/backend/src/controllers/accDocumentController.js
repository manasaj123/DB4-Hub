// backend/src/controllers/accDocumentController.js
const db = require('../config/db');
const { sequelize } = db;
const { Op } = require('sequelize');

const AccDocument = db.AccDocument;

// Validation helper
const validateDocumentData = (data) => {
  const errors = [];
  
  // Company Code validation
  if (!data.companyCode || !data.companyCode.trim()) {
    errors.push('Company code is required');
  } else if (!/^[A-Za-z0-9]+$/.test(data.companyCode.trim())) {
    errors.push('Company code can only contain letters and numbers');
  } else if (data.companyCode.trim().length > 10) {
    errors.push('Company code must be 10 characters or less');
  }
  
  // Currency validation
  if (!data.currency || !data.currency.trim()) {
    errors.push('Currency is required');
  } else if (!/^[A-Z]{2,3}$/.test(data.currency.trim())) {
    errors.push('Currency must be 2-3 uppercase letters (e.g., INR, USD, EUR)');
  }
  
  // Fiscal Year validation
  if (!data.fiscalYear) {
    errors.push('Fiscal year is required');
  } else if (typeof data.fiscalYear !== 'number' || data.fiscalYear < 2000 || data.fiscalYear > 2099) {
    errors.push('Fiscal year must be a valid year between 2000 and 2099');
  }
  
  // Date validations
  if (!data.documentDate) {
    errors.push('Document date is required');
  }
  if (!data.postingDate) {
    errors.push('Posting date is required');
  }
  
  // Period validation
  if (data.period && (data.period < 1 || data.period > 12)) {
    errors.push('Period must be between 1 and 12');
  }
  
  // Optional fields validation
  if (data.reference && data.reference.length > 50) {
    errors.push('Reference must be 50 characters or less');
  }
  if (data.crossCompNumber && !/^[A-Za-z0-9\-_.]*$/.test(data.crossCompNumber)) {
    errors.push('Cross-comp number can only contain letters, numbers, hyphens, underscores, and dots');
  }
  if (data.text && data.text.length > 255) {
    errors.push('Text must be 255 characters or less');
  }
  if (data.ledgerGroup && !/^[A-Za-z0-9]*$/.test(data.ledgerGroup)) {
    errors.push('Ledger group can only contain letters and numbers');
  }
  
  return errors;
};

// simple doc number
const generateDocNumber = async (companyCode, fiscalYear) => {
  const prefix = `ACC${fiscalYear}-`;

  // get last document for this company + year ordered by documentNumber descending
  const lastDoc = await AccDocument.findOne({
    where: { companyCode, fiscalYear },
    order: [['documentNumber', 'DESC']],
    attributes: ['documentNumber'],
  });

  let nextSeq = 1;

  if (lastDoc && lastDoc.documentNumber && lastDoc.documentNumber.startsWith(prefix)) {
    const lastStr = lastDoc.documentNumber.slice(prefix.length); // e.g. "000012"
    const lastNum = parseInt(lastStr, 10);
    if (!Number.isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  const seqStr = nextSeq.toString().padStart(6, '0');
  return `${prefix}${seqStr}`;
};

// GET /api/acc-documents
exports.list = async (req, res) => {
  try {
    const rows = await AccDocument.findAll({
      order: [['postingDate', 'DESC'], ['id', 'DESC']],
    });
    res.json(rows);
  } catch (err) {
    console.error('AccDocument list error', err);
    res.status(500).json({ message: 'Failed to load documents' });
  }
};

// POST /api/acc-documents
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      companyCode,
      fiscalYear,
      documentDate,
      postingDate,
      period,
      documentType,
      reference,
      referenceTransaction,
      referenceKey,
      crossCompNumber,
      currency,
      text,
      ledgerGroup,
      logicalSystem,
    } = req.body;

    // Clean and validate input data
    const cleanData = {
      companyCode: companyCode ? companyCode.trim() : '',
      fiscalYear: fiscalYear ? Number(fiscalYear) : null,
      documentDate: documentDate || null,
      postingDate: postingDate || null,
      period: period ? Number(period) : null,
      documentType: documentType ? documentType.trim() : null,
      reference: reference ? reference.trim() : '',
      referenceTransaction: referenceTransaction ? referenceTransaction.trim() : '',
      referenceKey: referenceKey ? referenceKey.trim() : '',
      crossCompNumber: crossCompNumber ? crossCompNumber.trim() : '',
      currency: currency ? currency.trim().toUpperCase() : 'INR',
      text: text ? text.trim() : '',
      ledgerGroup: ledgerGroup ? ledgerGroup.trim() : '',
      logicalSystem: logicalSystem ? logicalSystem.trim() : '',
    };

    // Validate
    const validationErrors = validateDocumentData(cleanData);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }

    if (!cleanData.companyCode || !cleanData.fiscalYear || !cleanData.documentDate || !cleanData.postingDate) {
      return res
        .status(400)
        .json({ message: 'Company code, fiscal year, document and posting date are required' });
    }

    const posting = new Date(cleanData.postingDate);
    const periodVal = cleanData.period || posting.getMonth() + 1;

    const documentNumber = await generateDocNumber(cleanData.companyCode, cleanData.fiscalYear);

    const header = await AccDocument.create(
      {
        documentNumber,
        companyCode: cleanData.companyCode,
        fiscalYear: cleanData.fiscalYear,
        documentDate: cleanData.documentDate,
        postingDate: cleanData.postingDate,
        entryDate: new Date(),
        period: periodVal,
        documentType: cleanData.documentType,
        reference: cleanData.reference,
        referenceTransaction: cleanData.referenceTransaction,
        referenceKey: cleanData.referenceKey,
        crossCompNumber: cleanData.crossCompNumber,
        currency: cleanData.currency,
        text: cleanData.text,
        ledgerGroup: cleanData.ledgerGroup,
        logicalSystem: cleanData.logicalSystem,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ id: header.id, documentNumber });
  } catch (err) {
    await t.rollback();
    console.error('AccDocument create error', err);
    
    // Handle specific errors
    if (err.name === 'SequelizeDatabaseError') {
      if (err.parent && err.parent.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({ 
          message: 'One or more fields exceed the maximum allowed length. Please check your input data.'
        });
      }
    }
    
    res.status(500).json({ message: 'Failed to post document' });
  }
};

// GET /api/acc-documents/search
exports.search = async (req, res) => {
  try {
    const q = req.query;
    const where = {};

    // Company code range
    if (q.companyCodeFrom && q.companyCodeTo) {
      where.companyCode = { [Op.between]: [q.companyCodeFrom, q.companyCodeTo] };
    } else if (q.companyCodeFrom) {
      where.companyCode = { [Op.gte]: q.companyCodeFrom };
    } else if (q.companyCodeTo) {
      where.companyCode = { [Op.lte]: q.companyCodeTo };
    }

    // Document number range
    if (q.documentNumberFrom && q.documentNumberTo) {
      where.documentNumber = {
        [Op.between]: [q.documentNumberFrom, q.documentNumberTo],
      };
    } else if (q.documentNumberFrom) {
      where.documentNumber = { [Op.gte]: q.documentNumberFrom };
    } else if (q.documentNumberTo) {
      where.documentNumber = { [Op.lte]: q.documentNumberTo };
    }

    // Fiscal year range
    if (q.fiscalYearFrom && q.fiscalYearTo) {
      where.fiscalYear = {
        [Op.between]: [Number(q.fiscalYearFrom), Number(q.fiscalYearTo)],
      };
    } else if (q.fiscalYearFrom) {
      where.fiscalYear = { [Op.gte]: Number(q.fiscalYearFrom) };
    } else if (q.fiscalYearTo) {
      where.fiscalYear = { [Op.lte]: Number(q.fiscalYearTo) };
    }

    // Posting date range
    if (q.postingDateFrom && q.postingDateTo) {
      where.postingDate = {
        [Op.between]: [q.postingDateFrom, q.postingDateTo],
      };
    } else if (q.postingDateFrom) {
      where.postingDate = { [Op.gte]: q.postingDateFrom };
    } else if (q.postingDateTo) {
      where.postingDate = { [Op.lte]: q.postingDateTo };
    }

    const rows = await AccDocument.findAll({
      where,
      order: [['postingDate', 'DESC'], ['id', 'DESC']],
    });

    res.json(rows);
  } catch (err) {
    console.error('AccDocument search error', err);
    res.status(500).json({ message: 'Failed to search documents' });
  }
};