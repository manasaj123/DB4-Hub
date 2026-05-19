// backend/controllers/routeController.js
const asyncHandler = require("../middleware/asyncHandler");
const db = require("../models");
const { Op } = require("sequelize");

const validateRoute = (data) => {
  const errors = {};

  const alphaNumRegex = /^[A-Za-z0-9]+$/;
  const alphaNumSpaceRegex = /^[A-Za-z0-9\s-]+$/;

  // Route Code
  if (!data.routeCode || !data.routeCode.trim()) {
    errors.routeCode = "Route Code is required";
  } else {
    if (!alphaNumRegex.test(data.routeCode)) {
      errors.routeCode = "Route Code must be alphanumeric only";
    }

    if (data.routeCode.length > 10) {
      errors.routeCode = "Route Code cannot exceed 10 characters";
    }
  }

  // Description
  if (!data.description || !data.description.trim()) {
    errors.description = "Description is required";
  } else {
    if (!alphaNumSpaceRegex.test(data.description)) {
      errors.description = "Description contains invalid characters";
    }

    if (data.description.length > 100) {
      errors.description = "Description cannot exceed 100 characters";
    }
  }

  return errors;
};

const validateStages = (stages) => {
  const errors = {};

  if (!Array.isArray(stages) || stages.length === 0) {
    errors.stages = "At least one stage is required";
    return errors;
  }

  stages.forEach((s, index) => {
    if (
      s.transitTime &&
      (!/^\d+$/.test(String(s.transitTime)) || Number(s.transitTime) < 0)
    ) {
      errors[`stage_${index}_transitTime`] =
        "Transit Time must be positive numeric";
    }
  });

  return errors;
};
// GET /api/routes
exports.getRoutes = asyncHandler(async (req, res) => {
  const list = await db.Route.findAll({ where: { isDeleted: false } });
  res.json(list);
});

// GET /api/routes/deleted
exports.getDeletedRoutes = asyncHandler(async (req, res) => {
  const list = await db.Route.findAll({ where: { isDeleted: true } });
  res.json(list);
});

// GET /api/routes/:id
exports.getRouteById = asyncHandler(async (req, res) => {
  const route = await db.Route.findByPk(req.params.id);
  if (!route) {
    res.status(404).json({ message: "Route not found" });
    return;
  }
  res.json(route);
});

// POST /api/routes
exports.createRoute = asyncHandler(async (req, res) => {
  req.body.routeCode = (req.body.routeCode || "").trim().toUpperCase();

  req.body.description = (req.body.description || "").trim();

  const errors = validateRoute(req.body);

  const parsedStages = JSON.parse(req.body.stagesJson || "[]");

  const stageErrors = validateStages(parsedStages);

  Object.assign(errors, stageErrors);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const existing = await db.Route.findOne({
    where: {
      routeCode: req.body.routeCode,
      isDeleted: false,
    },
  });

  if (existing) {
    return res.status(400).json({
      errors: {
        routeCode: "Route Code already exists",
      },
    });
  }

  const route = await db.Route.create(req.body);

  res.status(201).json(route);
});
// PUT /api/routes/:id
exports.updateRoute = asyncHandler(async (req, res) => {
  const route = await db.Route.findByPk(req.params.id);

  if (!route) {
    return res.status(404).json({
      message: "Route not found",
    });
  }

  req.body.routeCode = (req.body.routeCode || "").trim().toUpperCase();

  req.body.description = (req.body.description || "").trim();

  const errors = validateRoute(req.body);

  const parsedStages = JSON.parse(req.body.stagesJson || "[]");

  const stageErrors = validateStages(parsedStages);

  Object.assign(errors, stageErrors);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  const existing = await db.Route.findOne({
    where: {
      routeCode: req.body.routeCode,
      isDeleted: false,
      id: {
        [Op.ne]: req.params.id,
      },
    },
  });

  if (existing) {
    return res.status(400).json({
      errors: {
        routeCode: "Route Code already exists",
      },
    });
  }

  await route.update(req.body);

  res.json(route);
});

// DELETE /api/routes/:id
exports.softDeleteRoute = asyncHandler(async (req, res) => {
  const route = await db.Route.findByPk(req.params.id);
  if (!route) {
    res.status(404).json({ message: "Route not found" });
    return;
  }
  await route.update({ isDeleted: true });
  res.json({ message: "Route moved to recycle bin" });
});

// PUT /api/routes/:id/restore
exports.restoreRoute = asyncHandler(async (req, res) => {
  const route = await db.Route.findByPk(req.params.id);
  if (!route) {
    res.status(404).json({ message: "Route not found" });
    return;
  }
  await route.update({ isDeleted: false });
  res.json(route);
});
