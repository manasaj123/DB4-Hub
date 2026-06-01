const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");

// GET /api/pgi/ready
exports.getReadyForPGI = asyncHandler(async (req, res) => {
  const deliveries = await db.Delivery.findAll({
    where: {
      status: "PACKED",
      isDeleted: false,
    },
    include: [
      {
        model: db.Picking,
        where: {
          pickingStatus: "PICKED",
          packingStatus: "PACKED",
          postGoodsIssue: false,
          isDeleted: false,
        },
        required: true,
      },
      {
        model: db.SalesOrder,
        attributes: ["id"],
        include: [
          {
            model: db.Customer,
            as: "soldToParty",
            attributes: ["customerCode", "name"],
          },
        ],
      },
    ],
    order: [["createdAt", "ASC"]],
  });

  res.json(deliveries);
});

// POST /api/pgi/:deliveryId
exports.performPGI = asyncHandler(async (req, res) => {
  const { deliveryId } = req.params;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const result = await db.sequelize.transaction(async (t) => {
    // 1. Find delivery with picking
    const delivery = await db.Delivery.findOne({
      where: { id: deliveryId, status: "PACKED", isDeleted: false },
      include: [
        {
          model: db.Picking,
          where: {
            pickingStatus: "PICKED",
            packingStatus: "PACKED",
            postGoodsIssue: false,
            isDeleted: false,
          },
          required: true,
        },
      ],
      transaction: t,
    });

    if (!delivery || !delivery.Picking) {
      throw new Error(
        "Delivery not found or not in PACKED state with completed picking.",
      );
    }

    // 2. Parse itemsJson
    let items;
    try {
      items = JSON.parse(delivery.itemsJson);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Delivery has no items.");
      }
    } catch {
      throw new Error("Invalid itemsJson in delivery.");
    }

    // 3. Check stock for each item
    for (const item of items) {
      const material = await db.Material.findByPk(item.materialId, {
        transaction: t,
      });
      if (!material)
        throw new Error(`Material id ${item.materialId} not found.`);

      const stock = await db.Stock.findOne({
        where: {
          materialId: item.materialId,
          plant: delivery.plant,
          warehouse: delivery.warehouse,
        },
        transaction: t,
      });

      if (!stock || Number(stock.availableQty) < item.quantity) {
        throw new Error(
          `Insufficient stock for material ${material.materialCode} at ` +
            `${delivery.plant}/${delivery.warehouse}. ` +
            `Required: ${item.quantity}, Available: ${stock ? stock.availableQty : 0}`,
        );
      }
    }

    // 4. Reduce stock and create PGI log
    for (const item of items) {
      const stock = await db.Stock.findOne({
        where: {
          materialId: item.materialId,
          plant: delivery.plant,
          warehouse: delivery.warehouse,
        },
        transaction: t,
      });

      stock.availableQty = Number(stock.availableQty) - item.quantity;
      stock.reservedQty = Math.max(
        0,
        Number(stock.reservedQty) - item.quantity,
      );
      await stock.save({ transaction: t });

      // Also update material.availableStock total for convenience
      //   const material = await db.Material.findByPk(item.materialId, {
      //     transaction: t,
      //   });
      //   material.availableStock = Number(material.availableStock) - item.quantity;
      //   await material.save({ transaction: t });

      await db.PostGoodsIssue.create(
        {
          deliveryId: delivery.id,
          materialId: item.materialId,
          quantity: item.quantity,
          pgiDate: today,
        },
        { transaction: t },
      );
    }

    // 5. Update picking and delivery
    await delivery.Picking.update({ postGoodsIssue: true }, { transaction: t });
    await delivery.update({ status: "PGI_DONE" }, { transaction: t });

    return { message: "PGI completed successfully", deliveryId };
  });

  res.status(200).json(result);
});
