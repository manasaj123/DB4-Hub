// backend/src/controllers/glAccountController.js
const db = require('../config/db');
const { GLAccount } = db;

// Validation helper function
const validateGLAccountData = (data, isUpdate = false) => {
  const errors = [];
  
  // G/L Code validation
  if (data.glCode !== undefined) {
    const glCode = data.glCode.trim();
    if (!glCode) {
      errors.push('G/L Code is required');
    } else if (!/^[A-Za-z0-9]+$/.test(glCode)) {
      errors.push('G/L Code can only contain letters and numbers (no special characters)');
    } else if (glCode.length > 20) {
      errors.push('G/L Code must be 20 characters or less');
    }
  } else if (!isUpdate) {
    errors.push('G/L Code is required');
  }
  
  // Name validation
  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) {
      errors.push('Account name is required');
    } else if (!/^[A-Za-z0-9\s\-_.]+$/.test(name)) {
      errors.push('Account name contains invalid characters');
    } else if (name.length > 100) {
      errors.push('Account name must be 100 characters or less');
    }
  } else if (!isUpdate) {
    errors.push('Account name is required');
  }
  
  // Company Code validation
  if (data.companyCode !== undefined) {
    const companyCode = data.companyCode.trim();
    if (!companyCode) {
      errors.push('Company code is required');
    } else if (!/^[A-Za-z0-9]+$/.test(companyCode)) {
      errors.push('Company code can only contain letters and numbers (no special characters)');
    } else if (companyCode.length > 10) {
      errors.push('Company code must be 10 characters or less');
    }
  } else if (!isUpdate) {
    errors.push('Company code is required');
  }
  
  // Currency validation
  if (data.accountCurrency !== undefined) {
    const currency = data.accountCurrency.trim();
    if (!currency) {
      errors.push('Currency is required');
    } else if (!/^[A-Z]{2,3}$/.test(currency)) {
      errors.push('Currency must be 2-3 uppercase letters (e.g., INR, USD, EUR)');
    }
  } else if (!isUpdate) {
    errors.push('Currency is required');
  }
  
  // Account Type validation
  if (data.accountType !== undefined) {
    const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
    if (!validTypes.includes(data.accountType)) {
      errors.push('Invalid account type');
    }
  }
  
  // Optional fields validation
  const optionalFields = ['taxCategory', 'altAccountNumber', 'toleranceGroup', 'fieldStatusGroup', 'planningLevel'];
  optionalFields.forEach(field => {
    if (data[field] && !/^[A-Za-z0-9]*$/.test(data[field].trim())) {
      errors.push(`${field}: Only letters and numbers allowed`);
    }
  });
  
  return errors;
};

exports.list = async (req, res) => {
  try {
    const accounts = await GLAccount.findAll({
      order: [['glCode', 'ASC']],
    });
    res.json(accounts);
  } catch (err) {
    console.error('GLAccount list error', err);
    res.status(500).json({ message: 'Failed to load GL accounts' });
  }
};

exports.create = async (req, res) => {
  try {
    // Trim all string fields
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
    
    // Validate data
    const validationErrors = validateGLAccountData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Convert currency to uppercase
    if (req.body.accountCurrency) {
      req.body.accountCurrency = req.body.accountCurrency.toUpperCase();
    }
    
    const account = await GLAccount.create(req.body);
    res.status(201).json(account);
  } catch (err) {
    console.error('GLAccount create error', err);
    
    // Handle duplicate entry error
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path || 'field';
      const value = err.errors?.[0]?.value || '';
      return res.status(409).json({ 
        message: `G/L Code '${value}' already exists. Please use a different code.`,
        field: field,
        value: value
      });
    }
    
    // Handle validation errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: messages 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: 'Failed to create GL account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trim all string fields
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
    
    // Validate data
    const validationErrors = validateGLAccountData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Convert currency to uppercase
    if (req.body.accountCurrency) {
      req.body.accountCurrency = req.body.accountCurrency.toUpperCase();
    }
    
    const account = await GLAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: 'GL account not found' });
    }
    
    await account.update(req.body);
    res.json(account);
  } catch (err) {
    console.error('GLAccount update error', err);
    
    // Handle duplicate entry error for updates
    if (err.name === 'SequelizeUniqueConstraintError') {
      const field = err.errors?.[0]?.path || 'field';
      const value = err.errors?.[0]?.value || '';
      return res.status(409).json({ 
        message: `G/L Code '${value}' already exists. Please use a different code.`,
        field: field,
        value: value
      });
    }
    
    // Handle validation errors
    if (err.name === 'SequelizeValidationError') {
      const messages = err.errors.map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: messages 
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      message: 'Failed to update GL account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await GLAccount.findByPk(id);
    
    if (!account) {
      return res.status(404).json({ message: 'GL account not found' });
    }
    
    await account.destroy();
    res.json({ message: 'GL account deleted successfully' });
  } catch (err) {
    console.error('GLAccount delete error', err);
    res.status(500).json({ 
      message: 'Failed to delete GL account',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};