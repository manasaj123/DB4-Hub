// backend/src/models/GLAccount.js
module.exports = (sequelize, DataTypes) => {
  const GLAccount = sequelize.define(
    'GLAccount',
    {
      id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },

      // Identification
      glCode: { 
        type: DataTypes.STRING(20), 
        allowNull: false, 
        unique: true,  // This already creates a unique index
        validate: {
          notEmpty: {
            msg: 'G/L Code cannot be empty'
          },
          is: {
            args: /^[A-Za-z0-9]+$/,
            msg: 'G/L Code can only contain letters and numbers (no special characters or spaces)'
          },
          len: {
            args: [1, 20],
            msg: 'G/L Code must be between 1 and 20 characters'
          }
        }
      },
      name: { 
        type: DataTypes.STRING(100), 
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Account name cannot be empty'
          },
          is: {
            args: /^[A-Za-z0-9\s\-_.]+$/,
            msg: 'Account name can only contain letters, numbers, spaces, hyphens, underscores, and dots'
          },
          len: {
            args: [1, 100],
            msg: 'Account name must be between 1 and 100 characters'
          }
        }
      },
      companyCode: { 
        type: DataTypes.STRING(10), 
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'Company code cannot be empty'
          },
          is: {
            args: /^[A-Za-z0-9]+$/,
            msg: 'Company code can only contain letters and numbers (no special characters)'
          },
          len: {
            args: [1, 10],
            msg: 'Company code must be between 1 and 10 characters'
          }
        }
      },

      // Classification
      accountType: {
        type: DataTypes.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE']],
            msg: 'Invalid account type. Must be ASSET, LIABILITY, EQUITY, INCOME, or EXPENSE'
          }
        }
      },
      accountCurrency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'INR',
        validate: {
          notEmpty: {
            msg: 'Currency cannot be empty'
          },
          is: {
            args: /^[A-Z]{2,3}$/,
            msg: 'Currency must be 2-3 uppercase letters (e.g., INR, USD, EUR)'
          }
        }
      },

      // FICO control fields
      taxCategory: { 
        type: DataTypes.STRING(10),
        validate: {
          is: {
            args: /^[A-Za-z0-9]*$/,
            msg: 'Tax category can only contain letters and numbers'
          }
        }
      },
      reconciliationType: {
        type: DataTypes.ENUM('NONE', 'CUSTOMER', 'VENDOR'),
        allowNull: false,
        defaultValue: 'NONE',
        validate: {
          isIn: {
            args: [['NONE', 'CUSTOMER', 'VENDOR']],
            msg: 'Reconciliation type must be NONE, CUSTOMER, or VENDOR'
          }
        }
      },
      altAccountNumber: { 
        type: DataTypes.STRING(20),
        validate: {
          is: {
            args: /^[A-Za-z0-9]*$/,
            msg: 'Alternative account number can only contain letters and numbers'
          }
        }
      },
      toleranceGroup: { 
        type: DataTypes.STRING(10),
        validate: {
          is: {
            args: /^[A-Za-z0-9]*$/,
            msg: 'Tolerance group can only contain letters and numbers'
          }
        }
      },
      fieldStatusGroup: { 
        type: DataTypes.STRING(10),
        validate: {
          is: {
            args: /^[A-Za-z0-9]*$/,
            msg: 'Field status group can only contain letters and numbers'
          }
        }
      },
      planningLevel: { 
        type: DataTypes.STRING(10),
        validate: {
          is: {
            args: /^[A-Za-z0-9]*$/,
            msg: 'Planning level can only contain letters and numbers'
          }
        }
      },

      // Control flags
      isBlockedForPosting: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
      },
    },
    {
      tableName: 'gl_accounts',
      timestamps: false,
      // Remove the indexes section completely
      // The unique constraint on glCode is already defined in the field
    }
  );

  return GLAccount;
};