SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS fico_accounting
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fico_accounting;

-- ======================================================================
-- 1) acc_documents
-- ======================================================================
CREATE TABLE IF NOT EXISTS `acc_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentNumber` varchar(20) NOT NULL,
  `companyCode` varchar(10) NOT NULL,
  `fiscalYear` int NOT NULL,
  `documentDate` date NOT NULL,
  `postingDate` date NOT NULL,
  `entryDate` date DEFAULT NULL,
  `documentType` varchar(4) DEFAULT NULL,
  `period` tinyint NOT NULL,
  `reference` varchar(50) DEFAULT NULL,
  `referenceTransaction` varchar(10) DEFAULT NULL,
  `referenceKey` varchar(30) DEFAULT NULL,
  `logicalSystem` varchar(20) DEFAULT NULL,
  `crossCompNumber` varchar(20) DEFAULT NULL,
  `currency` varchar(3) NOT NULL,
  `text` varchar(255) DEFAULT NULL,
  `ledgerGroup` varchar(10) DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 2) ap_ar_document_lines
-- ======================================================================
CREATE TABLE IF NOT EXISTS `ap_ar_document_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentId` int NOT NULL,
  `glAccount` varchar(20) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `taxCode` varchar(10) DEFAULT NULL,
  `assignment` varchar(50) DEFAULT NULL,
  `lineText` varchar(255) DEFAULT NULL,
  `costCenter` varchar(20) DEFAULT NULL,
  `hsnCode` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 3) ap_ar_documents
-- ======================================================================
CREATE TABLE IF NOT EXISTS `ap_ar_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docType` varchar(30) NOT NULL,
  `partyType` enum('AP','AR') NOT NULL,
  `partyCode` varchar(30) NOT NULL,
  `status` enum('PARKED','POSTED') NOT NULL DEFAULT 'PARKED',
  `postingDate` date NOT NULL,
  `documentDate` date NOT NULL,
  `baselineDate` date DEFAULT NULL,
  `reference` varchar(50) DEFAULT NULL,
  `headerText` varchar(255) DEFAULT NULL,
  `businessPlace` varchar(30) DEFAULT NULL,
  `sectionCode` varchar(20) DEFAULT NULL,
  `invoiceReference` varchar(50) DEFAULT NULL,
  `bankAccount` varchar(30) DEFAULT NULL,
  `paymentMethod` varchar(10) DEFAULT NULL,
  `clearingDate` date DEFAULT NULL,
  `invoiceNumber` varchar(50) DEFAULT NULL,
  `downPaymentNumber` varchar(50) DEFAULT NULL,
  `clearingAmount` decimal(15,2) DEFAULT NULL,
  `remainingAmount` decimal(15,2) DEFAULT NULL,
  `advanceAmount` decimal(15,2) DEFAULT NULL,
  `balanceAmount` decimal(15,2) DEFAULT NULL,
  `startDate` date DEFAULT NULL,
  `endDate` date DEFAULT NULL,
  `frequency` varchar(20) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 4) ap_ar_open_items
-- ======================================================================
CREATE TABLE IF NOT EXISTS `ap_ar_open_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentId` int NOT NULL,
  `documentNumber` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `selected` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 5) ap_ar_withholding_taxes
-- ======================================================================
CREATE TABLE IF NOT EXISTS `ap_ar_withholding_taxes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentId` int NOT NULL,
  `taxType` varchar(10) DEFAULT NULL,
  `taxCode` varchar(10) DEFAULT NULL,
  `taxAmount` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 6) approval_instances
-- ======================================================================
CREATE TABLE IF NOT EXISTS `approval_instances` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `documentId` int unsigned NOT NULL,
  `documentType` enum('INVOICE','PAYMENT','JOURNAL','CREDIT_MEMO','DOWN_PAYMENT','PURCHASE_ORDER') NOT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `currentLevel` int unsigned DEFAULT '1',
  `workflowId` int unsigned NOT NULL,
  `createdBy` int unsigned NOT NULL,
  `approvedBy` int unsigned DEFAULT NULL,
  `approvedAt` datetime DEFAULT NULL,
  `remarks` text,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 7) approval_workflows
-- ======================================================================
CREATE TABLE IF NOT EXISTS `approval_workflows` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `documentType` varchar(50) NOT NULL,
  `levels` json NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 8) asset_classes
-- ======================================================================
CREATE TABLE IF NOT EXISTS `asset_classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(160) NOT NULL,
  `assetType` enum('TANGIBLE','INTANGIBLE') NOT NULL DEFAULT 'TANGIBLE',
  `depreciationArea` varchar(20) DEFAULT NULL,
  `usefulLifeYears` int DEFAULT NULL,
  `glAccountAsset` varchar(20) DEFAULT NULL,
  `glAccountAccumDep` varchar(20) DEFAULT NULL,
  `glAccountExpense` varchar(20) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 9) audit_logs
-- ======================================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `userId` int unsigned DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `entity` varchar(80) NOT NULL,
  `entityId` varchar(50) DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ipAddress` varchar(60) DEFAULT NULL,
  `userAgent` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 10) bank_statements
-- ======================================================================
CREATE TABLE IF NOT EXISTS `bank_statements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `bankName` varchar(120) NOT NULL,
  `accountNumber` varchar(40) NOT NULL,
  `statementDate` date NOT NULL,
  `txnDate` date NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `balance` decimal(15,2) DEFAULT '0.00',
  `matchedPaymentId` int unsigned DEFAULT NULL,
  `matched` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `matchedPaymentId` (`matchedPaymentId`),
  CONSTRAINT `fk_bank_statement_payment` FOREIGN KEY (`matchedPaymentId`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 11) budgets
-- ======================================================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `year` int NOT NULL,
  `month` int NOT NULL,
  `accountCode` varchar(20) NOT NULL,
  `costCenterId` int unsigned DEFAULT NULL,
  `profitCenterId` int unsigned DEFAULT NULL,
  `budgetAmount` decimal(15,2) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_budget` (`year`,`month`,`accountCode`,`costCenterId`,`profitCenterId`),
  KEY `costCenterId` (`costCenterId`),
  KEY `profitCenterId` (`profitCenterId`),
  CONSTRAINT `fk_budget_cost_center` FOREIGN KEY (`costCenterId`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_budget_profit_center` FOREIGN KEY (`profitCenterId`) REFERENCES `profit_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 12) categories
-- ======================================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('INCOME','EXPENSE') NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 13) clearings
-- ======================================================================
CREATE TABLE IF NOT EXISTS `clearings` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `invoiceId` int unsigned NOT NULL,
  `paymentId` int unsigned NOT NULL,
  `clearedAmount` decimal(15,2) NOT NULL,
  `clearingDate` date NOT NULL,
  `remainingAmount` decimal(15,2) NOT NULL,
  `createdBy` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoiceId` (`invoiceId`),
  KEY `paymentId` (`paymentId`),
  CONSTRAINT `clearings_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`),
  CONSTRAINT `clearings_ibfk_2` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 14) cost_centers
-- ======================================================================
CREATE TABLE IF NOT EXISTS `cost_centers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 15) credit_memos
-- ======================================================================
CREATE TABLE IF NOT EXISTS `credit_memos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `creditMemoNumber` varchar(50) NOT NULL,
  `type` enum('AR','AP') NOT NULL,
  `partyId` int unsigned NOT NULL,
  `partyName` varchar(160) NOT NULL,
  `referenceInvoice` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `taxAmount` decimal(15,2) DEFAULT '0.00',
  `totalAmount` decimal(15,2) NOT NULL,
  `date` date NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('DRAFT','POSTED','CANCELLED') DEFAULT 'DRAFT',
  `createdBy` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `creditMemoNumber` (`creditMemoNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 16) document_types
-- ======================================================================
CREATE TABLE IF NOT EXISTS `document_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(2) NOT NULL,
  `name` varchar(120) NOT NULL,
  `numberRange` varchar(40) DEFAULT NULL,
  `numberRangeType` enum('INTERNAL','EXTERNAL') NOT NULL DEFAULT 'INTERNAL',
  `reverseDocumentType` varchar(2) DEFAULT NULL,
  `allowCustomer` tinyint(1) DEFAULT '1',
  `allowVendor` tinyint(1) DEFAULT '1',
  `allowMaterial` tinyint(1) DEFAULT '1',
  `allowGLAccount` tinyint(1) DEFAULT '1',
  `documentCurrencyRequired` tinyint(1) DEFAULT '0',
  `postingPeriodCheck` tinyint(1) DEFAULT '1',
  `reversalAllowed` tinyint(1) DEFAULT '1',
  `partnerFunctionsRequired` tinyint(1) DEFAULT '0',
  `postingKeysAllowed` varchar(80) DEFAULT NULL,
  `headerTextRequired` tinyint(1) DEFAULT '0',
  `referenceTextRequired` tinyint(1) DEFAULT '0',
  `isActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 17) down_payments
-- ======================================================================
CREATE TABLE IF NOT EXISTS `down_payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `downPaymentNumber` varchar(50) NOT NULL,
  `partyId` int DEFAULT NULL,
  `partyName` varchar(160) NOT NULL,
  `type` enum('AR','AP') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `paymentDate` date NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `status` enum('POSTED','CLEARED','CANCELLED') NOT NULL DEFAULT 'POSTED',
  `clearedAmount` decimal(15,2) DEFAULT '0.00',
  `balanceAmount` decimal(15,2) DEFAULT '0.00',
  `createdBy` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `downPaymentNumber` (`downPaymentNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 18) expenses
-- ======================================================================
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `vendorName` varchar(160) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `accountCode` varchar(20) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `gstRate` decimal(5,2) DEFAULT '0.00',
  `gstAmount` decimal(15,2) DEFAULT '0.00',
  `tdsRate` decimal(5,2) DEFAULT '0.00',
  `tdsAmount` decimal(15,2) DEFAULT '0.00',
  `totalAmount` decimal(15,2) NOT NULL,
  `costCenterId` int unsigned DEFAULT NULL,
  `profitCenterId` int unsigned DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `costCenterId` (`costCenterId`),
  KEY `profitCenterId` (`profitCenterId`),
  CONSTRAINT `fk_expense_cost_center` FOREIGN KEY (`costCenterId`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_expense_profit_center` FOREIGN KEY (`profitCenterId`) REFERENCES `profit_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 19) fixed_assets
-- ======================================================================
CREATE TABLE IF NOT EXISTS `fixed_assets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `assetCode` varchar(50) NOT NULL,
  `assetName` varchar(100) NOT NULL,
  `category` enum('IT','FURNITURE','VEHICLE','BUILDING','OTHER') NOT NULL DEFAULT 'OTHER',
  `location` varchar(100) DEFAULT NULL,
  `purchaseDate` date NOT NULL,
  `purchaseCost` decimal(15,2) NOT NULL,
  `usefulLifeYears` int unsigned DEFAULT '0',
  `depreciationRate` decimal(5,2) DEFAULT '0.00',
  `notes` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assetCode` (`assetCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 20) fs_item_accounts
-- ======================================================================
CREATE TABLE IF NOT EXISTS `fs_item_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `itemId` int NOT NULL,
  `glAccountId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `itemId` (`itemId`),
  KEY `glAccountId` (`glAccountId`),
  CONSTRAINT `fk_fs_item_accounts_item` FOREIGN KEY (`itemId`) REFERENCES `fs_items` (`id`),
  CONSTRAINT `fk_fs_item_accounts_gl` FOREIGN KEY (`glAccountId`) REFERENCES `gl_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 21) fs_items
-- ======================================================================
CREATE TABLE IF NOT EXISTS `fs_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `versionId` int NOT NULL,
  `itemKey` varchar(20) NOT NULL,
  `parentItemKey` varchar(20) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `itemType` varchar(20) NOT NULL DEFAULT 'HEADER',
  `sortOrder` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `versionId` (`versionId`),
  CONSTRAINT `fk_fs_items_version` FOREIGN KEY (`versionId`) REFERENCES `fs_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 22) fs_versions
-- ======================================================================
CREATE TABLE IF NOT EXISTS `fs_versions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `chartOfAccounts` varchar(20) NOT NULL,
  `maintenanceLanguage` varchar(5) NOT NULL DEFAULT 'EN',
  `itemKeysAuto` tinyint(1) NOT NULL DEFAULT '1',
  `groupAccountNumber` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 23) gl_accounts
-- ======================================================================
CREATE TABLE IF NOT EXISTS `gl_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `glCode` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `companyCode` varchar(10) NOT NULL,
  `accountType` varchar(20) NOT NULL,
  `accountCurrency` varchar(10) NOT NULL DEFAULT 'INR',
  `taxCategory` varchar(50) DEFAULT NULL,
  `reconciliationType` varchar(20) NOT NULL DEFAULT 'NONE',
  `altAccountNumber` varchar(50) DEFAULT NULL,
  `toleranceGroup` varchar(50) DEFAULT NULL,
  `fieldStatusGroup` varchar(50) DEFAULT NULL,
  `planningLevel` varchar(50) DEFAULT NULL,
  `isBlockedForPosting` tinyint(1) NOT NULL DEFAULT '0',
  `accountController` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `glCode` (`glCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 24) grir_clearing
-- ======================================================================
CREATE TABLE IF NOT EXISTS `grir_clearing` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `poNumber` varchar(50) NOT NULL,
  `invoiceNumber` varchar(50) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `clearedAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `status` enum('PENDING','CLEARED','PARTIAL','DISCREPANCY') NOT NULL DEFAULT 'PENDING',
  `grDate` date DEFAULT NULL,
  `invoiceDate` date DEFAULT NULL,
  `vendorName` varchar(160) DEFAULT NULL,
  `createdBy` int unsigned NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `narration` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 25) invoices
-- ======================================================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `invoiceNumber` varchar(50) NOT NULL,
  `type` enum('AR','AP') NOT NULL,
  `partyId` int unsigned DEFAULT NULL,
  `partyName` varchar(160) NOT NULL,
  `partyGSTIN` varchar(20) DEFAULT NULL,
  `date` date NOT NULL,
  `dueDate` date DEFAULT NULL,
  `baseAmount` decimal(15,2) NOT NULL,
  `gstRate` decimal(5,2) DEFAULT '0.00',
  `gstAmount` decimal(15,2) DEFAULT '0.00',
  `tdsRate` decimal(5,2) DEFAULT '0.00',
  `tdsAmount` decimal(15,2) DEFAULT '0.00',
  `totalAmount` decimal(15,2) NOT NULL,
  `balanceAmount` decimal(15,2) NOT NULL,
  `status` enum('DRAFT','PARKED','PENDING','APPROVED','REJECTED','POSTED','PARTLY_PAID','PAID') NOT NULL DEFAULT 'DRAFT',
  `createdBy` int unsigned NOT NULL,
  `costCenterId` int unsigned DEFAULT NULL,
  `profitCenterId` int unsigned DEFAULT NULL,
  `narration` varchar(255) DEFAULT NULL,
  `parkedBy` int unsigned DEFAULT NULL,
  `parkedDate` datetime DEFAULT NULL,
  `approvedBy` int unsigned DEFAULT NULL,
  `approvalDate` datetime DEFAULT NULL,
  `approvalRemarks` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoiceNumber` (`invoiceNumber`),
  KEY `createdBy` (`createdBy`),
  KEY `costCenterId` (`costCenterId`),
  KEY `profitCenterId` (`profitCenterId`),
  KEY `fk_invoices_party` (`partyId`),
  CONSTRAINT `fk_invoices_party` FOREIGN KEY (`partyId`) REFERENCES `parties` (`id`),
  CONSTRAINT `fk_invoice_user` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_invoice_cost_center` FOREIGN KEY (`costCenterId`) REFERENCES `cost_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_invoice_profit_center` FOREIGN KEY (`profitCenterId`) REFERENCES `profit_centers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 26) journal_headers
-- ======================================================================
CREATE TABLE IF NOT EXISTS `journal_headers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `documentNumber` varchar(30) NOT NULL,
  `documentType` varchar(4) NOT NULL,
  `documentDate` date NOT NULL,
  `postingDate` date NOT NULL,
  `companyCode` varchar(10) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `reference` varchar(50) DEFAULT NULL,
  `headerText` varchar(255) DEFAULT NULL,
  `crossCCNo` varchar(50) DEFAULT NULL,
  `status` varchar(10) NOT NULL DEFAULT 'POSTED',
  `createdBy` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `documentNumber` (`documentNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 27) journal_lines
-- ======================================================================
CREATE TABLE IF NOT EXISTS `journal_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `journalId` int NOT NULL,
  `lineNo` int NOT NULL,
  `glAccount` varchar(20) NOT NULL,
  `debit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `credit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `costCenterId` varchar(20) DEFAULT NULL,
  `profitCenterId` varchar(20) DEFAULT NULL,
  `narration` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `journalId` (`journalId`),
  CONSTRAINT `journal_lines_ibfk_1` FOREIGN KEY (`journalId`) REFERENCES `journal_headers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 28) ledger
-- ======================================================================
CREATE TABLE IF NOT EXISTS `ledger` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL DEFAULT (curdate()),
  `accountCode` varchar(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `referenceType` varchar(20) NOT NULL,
  `referenceNumber` varchar(50) DEFAULT NULL,
  `invoiceId` int unsigned DEFAULT NULL,
  `paymentId` int unsigned DEFAULT NULL,
  `expenseId` int unsigned DEFAULT NULL,
  `bankStatementId` bigint unsigned DEFAULT NULL,
  `costCenterId` int unsigned DEFAULT NULL,
  `profitCenterId` int unsigned DEFAULT NULL,
  `projectId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoiceId` (`invoiceId`),
  KEY `paymentId` (`paymentId`),
  KEY `expenseId` (`expenseId`),
  KEY `bankStatementId` (`bankStatementId`),
  KEY `fk_ledger_cost_center` (`costCenterId`),
  KEY `fk_ledger_profit_center` (`profitCenterId`),
  KEY `fk_ledger_project` (`projectId`),
  CONSTRAINT `fk_ledger_invoice` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ledger_payment` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ledger_expense` FOREIGN KEY (`expenseId`) REFERENCES `expenses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ledger_bank_statement` FOREIGN KEY (`bankStatementId`) REFERENCES `bank_statements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ledger_cost_center` FOREIGN KEY (`costCenterId`) REFERENCES `cost_centers` (`id`),
  CONSTRAINT `fk_ledger_profit_center` FOREIGN KEY (`profitCenterId`) REFERENCES `profit_centers` (`id`),
  CONSTRAINT `fk_ledger_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 29) parties
-- ======================================================================
CREATE TABLE IF NOT EXISTS `parties` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `type` enum('Customer','Vendor') NOT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 30) payments
-- ======================================================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `paymentNumber` varchar(50) NOT NULL,
  `type` enum('PAYMENT','RECEIPT','DEBIT_NOTE','CREDIT_NOTE') DEFAULT NULL,
  `invoiceId` int unsigned NOT NULL,
  `date` date NOT NULL,
  `mode` enum('CASH','BANK_TRANSFER','CHEQUE','UPI','CARD') NOT NULL,
  `bankAccountCode` varchar(20) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `tdsAmount` decimal(15,2) DEFAULT '0.00',
  `referenceNumber` varchar(100) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `reconciled` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paymentNumber` (`paymentNumber`),
  KEY `invoiceId` (`invoiceId`),
  CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 31) period_closing
-- ======================================================================
CREATE TABLE IF NOT EXISTS `period_closing` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `period` varchar(20) NOT NULL,
  `status` enum('OPEN','CLOSED','LOCKED') DEFAULT 'OPEN',
  `closedBy` int unsigned DEFAULT NULL,
  `closedDate` date DEFAULT NULL,
  `depreciationRun` tinyint(1) DEFAULT '0',
  `accrualsPosted` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `periodStart` date DEFAULT NULL,
  `periodEnd` date DEFAULT NULL,
  `closedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `period` (`period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ======================================================================
-- 32) profit_centers
-- ======================================================================
CREATE TABLE IF NOT EXISTS `profit_centers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 33) projects
-- ======================================================================
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 34) users
-- ======================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('ADMIN','ACCOUNTANT','AUDITOR','VIEWER') DEFAULT 'ACCOUNTANT',
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 35) vendor_customer_invoice_lines
-- ======================================================================
CREATE TABLE IF NOT EXISTS `vendor_customer_invoice_lines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoiceId` int NOT NULL,
  `partyName` varchar(160) DEFAULT NULL,
  `glAccount` varchar(20) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `taxCode` varchar(10) DEFAULT NULL,
  `assignment` varchar(50) DEFAULT NULL,
  `lineText` varchar(255) DEFAULT NULL,
  `costCenter` varchar(20) DEFAULT NULL,
  `hsnCode` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ======================================================================
-- 36) vendor_customer_invoices
-- ======================================================================
CREATE TABLE IF NOT EXISTS `vendor_customer_invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mode` enum('VENDOR','CUSTOMER') NOT NULL,
  `postingDate` date NOT NULL,
  `documentDate` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference` varchar(50) DEFAULT NULL,
  `businessPlace` varchar(30) DEFAULT NULL,
  `text` varchar(255) DEFAULT NULL,
  `baselineDate` date DEFAULT NULL,
  `vendorCode` varchar(20) DEFAULT NULL,
  `sectionCode` varchar(20) DEFAULT NULL,
  `customerCode` varchar(20) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;