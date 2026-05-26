module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      type: {
        // AR = customer invoice, AP = vendor invoice
        type: DataTypes.ENUM("AR", "AP"),
        allowNull: false,
      },
      partyName: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      partyGSTIN: {
        type: DataTypes.STRING(20),
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      dueDate: {
        type: DataTypes.DATEONLY,
      },
      baseAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      gstRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      gstAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      tdsRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      tdsAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      totalAmount: {
        // base + GST - TDS (receivable/payable)
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      clearedAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0.0,
      },
      balanceAmount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          "DRAFT",
          "POSTED",
          "PARTLY_PAID",
          "PAID",
          "CANCELLED",
        ),
        defaultValue: "DRAFT",
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      costCenterId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      profitCenterId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      narration: {
        type: DataTypes.STRING(255),
      },
    },
    {
      tableName: "invoices",
      timestamps: true,
    },
  );

  return Invoice;
};
