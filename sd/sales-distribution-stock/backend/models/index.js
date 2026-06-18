// backend/models/index.js
const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  },
);

const db = {};
db.sequelize = sequelize;

// ================= MATERIAL =================
db.Material = sequelize.define(
  "Material",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    materialCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: { type: DataTypes.STRING(255), allowNull: false },
    baseUom: { type: DataTypes.STRING(10), allowNull: false },
    materialType: { type: DataTypes.STRING(20), allowNull: false },
    industrySector: { type: DataTypes.STRING(20), allowNull: false },
    documentDate: { type: DataTypes.DATEONLY },
    plant: { type: DataTypes.STRING(10) },
    storageLocation: { type: DataTypes.STRING(10) },
    movementType: { type: DataTypes.STRING(4) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "materials", timestamps: true },
);

// ================= SALES VIEW =================
db.SalesView = sequelize.define(
  "SalesView",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    materialId: { type: DataTypes.INTEGER, allowNull: false },
    salesOrg: { type: DataTypes.STRING(10), allowNull: false },
    distributionChannel: { type: DataTypes.STRING(10), allowNull: false },
    division: { type: DataTypes.STRING(10), allowNull: false },
    deliveringPlant: { type: DataTypes.STRING(10), allowNull: false },
    itemCategoryGroup: { type: DataTypes.STRING(10), allowNull: false },
    loadingGroup: { type: DataTypes.STRING(10) },
    accountAssignmentGroup: { type: DataTypes.STRING(10) },
    priceGroup: { type: DataTypes.STRING(10) },
    priceList: { type: DataTypes.STRING(10) },
    availabilityCheck: { type: DataTypes.STRING(10) },
    transportationGroup: { type: DataTypes.STRING(10) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "sales_views", timestamps: true },
);

// ================= CUSTOMER GROUP =================
db.CustomerGroup = sequelize.define(
  "CustomerGroup",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    accountGroup: { type: DataTypes.STRING(4), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    fieldStatusGeneral: {
      type: DataTypes.STRING(20),
      defaultValue: "optional",
    },
    fieldStatusCompanyCode: {
      type: DataTypes.STRING(20),
      defaultValue: "optional",
    },
    fieldStatusSales: { type: DataTypes.STRING(20), defaultValue: "optional" },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "customer_groups", timestamps: true },
);

// ================= CUSTOMER (ALIGNED WITH SQL) =================
// CREATE TABLE customers (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   customer_code VARCHAR(20) NOT NULL UNIQUE,
//   name VARCHAR(100) NOT NULL,
//   city VARCHAR(100),
//   country VARCHAR(100),
//   credit_group VARCHAR(10),
//   risk_category VARCHAR(10),
//   is_deleted TINYINT(1) NOT NULL DEFAULT 0,
//   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// );
// Customer
// ================= CUSTOMER =================
db.Customer = sequelize.define(
  "Customer",
  {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    customerCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    accountGroup: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(3),
      allowNull: true,
    },
    creditGroup: { 
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    riskCategory: { 
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    // ===== ADD THESE FIELDS =====
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gstNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // ===========================
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "customers",
    timestamps: true,
  },
);

// ================= INQUIRY =================
db.Inquiry = sequelize.define(
  "Inquiry",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    inquiryType: { type: DataTypes.STRING(4), defaultValue: "IN" },
    salesOrg: { type: DataTypes.STRING(10), allowNull: false },
    distributionChannel: { type: DataTypes.STRING(10), allowNull: false },
    division: { type: DataTypes.STRING(10), allowNull: false },
    soldToPartyId: { type: DataTypes.INTEGER, allowNull: false },
    shipToPartyId: { type: DataTypes.INTEGER, allowNull: false },
    materialId: { type: DataTypes.INTEGER, allowNull: true },
    materialCode: { type: DataTypes.STRING(20), allowNull: true },
    quantity: { type: DataTypes.DECIMAL(15, 3), allowNull: true },
    itemsJson: { type: DataTypes.TEXT },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "inquiries", timestamps: true },
);

// ================= QUOTATION =================
db.Quotation = sequelize.define(
  "Quotation",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    quotationType: { type: DataTypes.STRING(4), allowNull: false },
    salesOrg: { type: DataTypes.STRING(10), allowNull: false },
    distributionChannel: { type: DataTypes.STRING(10), allowNull: false },
    division: { type: DataTypes.STRING(10), allowNull: false },
    salesOffice: { type: DataTypes.STRING(10) },
    salesGroup: { type: DataTypes.STRING(10) },
    partnerFunction: { type: DataTypes.STRING(4) },
    soldToPartyId: { type: DataTypes.INTEGER, allowNull: false },
    shipToPartyId: { type: DataTypes.INTEGER, allowNull: false },
    purchaseOrderNumber: { type: DataTypes.STRING(30) },
    validFrom: { type: DataTypes.DATEONLY },
    validTo: { type: DataTypes.DATEONLY },
    itemsJson: { type: DataTypes.TEXT },
    referenceInquiryId: { type: DataTypes.INTEGER },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "quotations", timestamps: true },
);

// ================= SALES ORDER =================
db.SalesOrder = sequelize.define(
  "SalesOrder",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderType: { type: DataTypes.STRING(4), allowNull: false },
    salesOrg: { type: DataTypes.STRING(10), allowNull: false },
    distributionChannel: { type: DataTypes.STRING(10), allowNull: false },
    division: { type: DataTypes.STRING(10), allowNull: false },
    salesOffice: { type: DataTypes.STRING(10) },
    salesGroup: { type: DataTypes.STRING(10) },
    soldToPartyId: { type: DataTypes.INTEGER, allowNull: false },
    shipToPartyId: { type: DataTypes.INTEGER, allowNull: false },
    itemsJson: { type: DataTypes.TEXT },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "sales_orders", timestamps: true },
);

// ================= SALES DOCUMENT CONFIG =================
db.SalesDocumentConfig = sequelize.define(
  "SalesDocumentConfig",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    documentType: { type: DataTypes.STRING(4), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(100), allowNull: false },
    referenceMandatory: { type: DataTypes.BOOLEAN, defaultValue: false },
    checkDivision: { type: DataTypes.BOOLEAN, defaultValue: false },
    probability: { type: DataTypes.INTEGER, defaultValue: 100 },
    checkCreditLimit: { type: DataTypes.BOOLEAN, defaultValue: false },
    creditGroup: { type: DataTypes.STRING(4) },
    screenSequence: { type: DataTypes.STRING(10) },
    incompletionProcedure: { type: DataTypes.STRING(10) },
    transactionGroup: { type: DataTypes.STRING(10) },
    docPricingProcedure: { type: DataTypes.STRING(10) },
    deliveryType: { type: DataTypes.STRING(4) },
    deliveryBlock: { type: DataTypes.STRING(4) },
    shippingConditions: { type: DataTypes.STRING(4) },
    shipCostInfoProfile: { type: DataTypes.STRING(10) },
    delvBillingType: { type: DataTypes.STRING(4) },
    orderRelBillingType: { type: DataTypes.STRING(4) },
    intercompanyBillingType: { type: DataTypes.STRING(4) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "sales_document_configs", timestamps: true },
);

// ================= ITEM CATEGORIES CONFIG =================
// ================= ITEM CATEGORIES CONFIG =================
db.ItemCategoriesConfig = sequelize.define(
  "ItemCategoriesConfig",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    salesDocumentType: { type: DataTypes.STRING(10), allowNull: false },
    itemCategoryGroup: { type: DataTypes.STRING(10), allowNull: false },
    itemUsage: { type: DataTypes.STRING(10) },
    itemCategoryHighLevelItem: { type: DataTypes.STRING(10) },

    defaultItemCategory: { type: DataTypes.STRING(4), allowNull: false },
    manualItemCategory: { type: DataTypes.STRING(4) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "item_categories_configs", timestamps: true },
);

// ================= SCHEDULE LINE =================
db.ScheduleLine = sequelize.define(
  "ScheduleLine",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    scheduleLineCategory: {
      type: DataTypes.STRING(3),
      allowNull: false,
      unique: true,
    },
    description: { type: DataTypes.STRING(100) },

    // must exist and match DB column names
    requirementRelevant: { type: DataTypes.STRING(1) }, // maps to requirementRelevant
    availabilityCheck: { type: DataTypes.STRING(2) }, // maps to availabilityCheck

    deliveryBlock: { type: DataTypes.STRING(4) },
    movementType: { type: DataTypes.STRING(4) },
    orderType: { type: DataTypes.STRING(4) },
    itemCategory: { type: DataTypes.STRING(4) },
    updateScheduleLines: { type: DataTypes.BOOLEAN, defaultValue: true },
    mvtIssValSlt: { type: DataTypes.STRING(4) },
    specIssValSlt: { type: DataTypes.STRING(4) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "schedule_lines", timestamps: true },
);
// ================= CONDITION =================
db.Condition = sequelize.define(
  "Condition",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    conditionType: { type: DataTypes.STRING(4), allowNull: false },
    customerId: { type: DataTypes.INTEGER },
    materialId: { type: DataTypes.INTEGER },
    salesOrg: { type: DataTypes.STRING(10) },
    distributionChannel: { type: DataTypes.STRING(10) },
    price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: "INR" },
    validFrom: { type: DataTypes.DATEONLY },
    validTo: { type: DataTypes.DATEONLY },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "conditions", timestamps: true },
);

// ================= AGREEMENT =================
db.Agreement = sequelize.define(
  "Agreement",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    vendorName: { type: DataTypes.STRING(150), allowNull: false },
    contractType: { type: DataTypes.STRING(4), allowNull: false },
    purchasingOrg: { type: DataTypes.STRING(10), allowNull: false },
    purchasingGroup: { type: DataTypes.STRING(10), allowNull: false },
    plant: { type: DataTypes.STRING(10), allowNull: false },
    agreementDate: { type: DataTypes.DATEONLY, allowNull: false },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "agreements", timestamps: true },
);

// ================= QUOTA =================
db.Quota = sequelize.define(
  "Quota",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    purchasingGroup: { type: DataTypes.STRING(10), allowNull: false },
    plant: { type: DataTypes.STRING(10), allowNull: false },
    plantSpecialMaterialStatus: { type: DataTypes.STRING(4) },
    taxIndicatorForMaterial: { type: DataTypes.STRING(4) },
    materialFreightGroup: { type: DataTypes.STRING(10) },
    materialGroup: { type: DataTypes.STRING(10) },
    validFrom: { type: DataTypes.DATEONLY },
    validTo: { type: DataTypes.DATEONLY },
    quotaUsage: { type: DataTypes.STRING(4) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "quotas", timestamps: true },
);

// ================= SHIPPING =================
db.Shipping = sequelize.define(
  "Shipping",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    shippingPoint: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    description: { type: DataTypes.STRING(100) },
    defaultRoute: { type: DataTypes.STRING(10) },
    plant: { type: DataTypes.STRING(10) },
    planningRelevant: { type: DataTypes.BOOLEAN, defaultValue: true },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "shipping", timestamps: true },
);

// ================= ROUTE =================
db.Route = sequelize.define(
  "Route",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    routeCode: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    description: { type: DataTypes.STRING(100) },
    stagesJson: { type: DataTypes.TEXT },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "routes", timestamps: true },
);

// ================= DELIVERY =================
db.Delivery = sequelize.define(
  "Delivery",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    shippingPoint: { type: DataTypes.STRING(10), allowNull: false },
    salesOrderId: { type: DataTypes.INTEGER, allowNull: false },
    itemsJson: { type: DataTypes.TEXT },
    warehouse: { type: DataTypes.STRING(10) },
    plant: { type: DataTypes.STRING(10) },
    route: { type: DataTypes.STRING(10) }, // ← new
    deliveryGroup: { type: DataTypes.STRING(10) },
    postGoodsIssueDate: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.ENUM("OPEN", "PICKED", "PACKED", "PGI_DONE"),
      defaultValue: "OPEN",
    },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "deliveries", timestamps: true },
);

// ================= PICKING =================
db.Picking = sequelize.define(
  "Picking",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deliveryId: { type: DataTypes.INTEGER, allowNull: false },
    warehouse: { type: DataTypes.STRING(10) },
    plant: { type: DataTypes.STRING(10) },
    pickingStatus: {
      type: DataTypes.ENUM("OPEN", "PICKED"),
      defaultValue: "OPEN",
    },
    packingStatus: {
      type: DataTypes.ENUM("OPEN", "PACKED"),
      defaultValue: "OPEN",
    },
    postGoodsIssue: { type: DataTypes.BOOLEAN, defaultValue: false },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "pickings", timestamps: true },
);

// ================= POST GOODS ISSUE =================
db.PostGoodsIssue = sequelize.define(
  "PostGoodsIssue",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deliveryId: { type: DataTypes.INTEGER, allowNull: false },
    materialId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(15, 3), allowNull: false },
    pgiDate: { type: DataTypes.DATEONLY, allowNull: false },
  },
  { tableName: "post_goods_issues", timestamps: true },
);

// Associations
db.Delivery.hasMany(db.PostGoodsIssue, { foreignKey: "deliveryId" });
db.PostGoodsIssue.belongsTo(db.Delivery, { foreignKey: "deliveryId" });

db.Material.hasMany(db.PostGoodsIssue, { foreignKey: "materialId" });
db.PostGoodsIssue.belongsTo(db.Material, { foreignKey: "materialId" });

// ================= STOCK (real inventory) =================
db.Stock = sequelize.define(
  "Stock",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    materialId: { type: DataTypes.INTEGER, allowNull: false },
    plant: { type: DataTypes.STRING(10), allowNull: false },
    warehouse: { type: DataTypes.STRING(10) },
    storageLocation: { type: DataTypes.STRING(10) },
    availableQty: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    reservedQty: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
  },
  { tableName: "stock", timestamps: true },
);

// Associations
db.Material.hasMany(db.Stock, { foreignKey: "materialId" });
db.Stock.belongsTo(db.Material, { foreignKey: "materialId" });

// ================= BILLING =================
db.Billing = sequelize.define(
  "Billing",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    billingType: { type: DataTypes.STRING(4), allowNull: false },
    billingDate: { type: DataTypes.DATEONLY, allowNull: false },
    referenceDeliveryId: { type: DataTypes.INTEGER, allowNull: false },
    documentNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    totalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: "INR" },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "billings", timestamps: true },
);

// ================= CREDIT =================
db.Credit = sequelize.define(
  "Credit",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    creditLimit: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: "INR" },
    riskCategory: { type: DataTypes.STRING(4) },
    creditGroup: { type: DataTypes.STRING(4) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "credits", timestamps: true },
);

// ================= PRICING CONFIG =================
db.PricingConfig = sequelize.define(
  "PricingConfig",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    pricingProcedure: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    description: { type: DataTypes.STRING(100) },
    isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: "pricing_configs", timestamps: true },
);

// ================= ASSOCIATIONS =================
db.Material.hasMany(db.SalesView, { foreignKey: "materialId" });
db.SalesView.belongsTo(db.Material, { foreignKey: "materialId" });

db.Customer.hasMany(db.Inquiry, {
  foreignKey: "soldToPartyId",
  as: "soldInquiries",
});
db.Customer.hasMany(db.Inquiry, {
  foreignKey: "shipToPartyId",
  as: "shipInquiries",
});
db.Inquiry.belongsTo(db.Customer, {
  foreignKey: "soldToPartyId",
  as: "soldToParty",
});
db.Inquiry.belongsTo(db.Customer, {
  foreignKey: "shipToPartyId",
  as: "shipToParty",
});

db.Customer.hasMany(db.Quotation, {
  foreignKey: "soldToPartyId",
  as: "soldQuotations",
});
db.Customer.hasMany(db.Quotation, {
  foreignKey: "shipToPartyId",
  as: "shipQuotations",
});
db.Quotation.belongsTo(db.Customer, {
  foreignKey: "soldToPartyId",
  as: "soldToParty",
});
db.Quotation.belongsTo(db.Customer, {
  foreignKey: "shipToPartyId",
  as: "shipToParty",
});
db.Quotation.belongsTo(db.Inquiry, {
  foreignKey: "referenceInquiryId",
  as: "referenceInquiry",
});

db.Customer.hasMany(db.SalesOrder, {
  foreignKey: "soldToPartyId",
  as: "soldOrders",
});
db.Customer.hasMany(db.SalesOrder, {
  foreignKey: "shipToPartyId",
  as: "shipOrders",
});
db.SalesOrder.belongsTo(db.Customer, {
  foreignKey: "soldToPartyId",
  as: "soldToParty",
});
db.SalesOrder.belongsTo(db.Customer, {
  foreignKey: "shipToPartyId",
  as: "shipToParty",
});
db.SalesOrder.belongsTo(db.Inquiry, {
  foreignKey: "referenceInquiryId",
  as: "referenceInquiry",
});
db.SalesOrder.belongsTo(db.Quotation, {
  foreignKey: "referenceQuotationId",
  as: "referenceQuotation",
});

db.SalesOrder.hasMany(db.Delivery, { foreignKey: "salesOrderId" });
db.Delivery.belongsTo(db.SalesOrder, { foreignKey: "salesOrderId" });

db.Delivery.hasOne(db.Picking, { foreignKey: "deliveryId" });
db.Picking.belongsTo(db.Delivery, { foreignKey: "deliveryId" });

db.Delivery.hasMany(db.Billing, { foreignKey: "referenceDeliveryId" });
db.Billing.belongsTo(db.Delivery, { foreignKey: "referenceDeliveryId" });

db.Customer.hasMany(db.Credit, { foreignKey: "customerId" });
db.Credit.belongsTo(db.Customer, { foreignKey: "customerId" });

db.Customer.hasMany(db.Condition, { foreignKey: "customerId" });
db.Condition.belongsTo(db.Customer, {
  foreignKey: "customerId",
  as: "customer",
});

db.Material.hasMany(db.Condition, { foreignKey: "materialId" });
db.Condition.belongsTo(db.Material, {
  foreignKey: "materialId",
  as: "material",
});

// Inquiry ↔ Material
db.Material.hasMany(db.Inquiry, {
  foreignKey: "materialId",
});

db.Inquiry.belongsTo(db.Material, {
  foreignKey: "materialId",
});

module.exports = db;
