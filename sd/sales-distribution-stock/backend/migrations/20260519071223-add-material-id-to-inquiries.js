"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add materialId column
    await queryInterface.addColumn("inquiries", "materialId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add foreign key constraint
    await queryInterface.addConstraint("inquiries", {
      fields: ["materialId"],
      type: "foreign key",
      name: "fk_inquiries_material",
      references: {
        table: "materials",
        field: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key first
    await queryInterface.removeConstraint(
      "inquiries",
      "fk_inquiries_material",
    );

    // Remove column
    await queryInterface.removeColumn("inquiries", "materialId");
  },
};