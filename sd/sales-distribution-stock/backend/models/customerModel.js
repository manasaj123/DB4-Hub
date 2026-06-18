// backend/models/Customer.js
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customerCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'customerCode'
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'name'
    },
    accountGroup: {
      type: DataTypes.STRING(4),
      allowNull: false,
      field: 'accountGroup'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'city'
    },
    country: {
      type: DataTypes.STRING(3),
      allowNull: false,
      field: 'country'
    },
    creditGroup: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'creditGroup'
    },
    riskCategory: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'riskCategory'
    },
    // ===== CRITICAL: ADD THESE FIELDS =====
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'email'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'phone'
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'address'
    },
    gstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'gstNumber'
    },
    // ===================================
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'isDeleted'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updatedAt'
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    underscored: false
  });

  return Customer;
};