import Category from "../models/Category.js";
import Resource, { RESOURCE_STATUSES } from "../models/Resource.js";
import { httpError } from "../utils/httpError.js";

function readText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  return Number(value);
}

function readRequirements(value) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw httpError("Requirements must be a list of text items", 400);
  }

  const requirements = value.map((item) => item.trim()).filter(Boolean);

  if (requirements.length === 0) {
    throw httpError("Add at least one booking requirement", 400);
  }

  if (requirements.join(" ").length > 600) {
    throw httpError("Requirements must be 600 characters or fewer", 400);
  }

  return requirements;
}

function validateImageUrl(value) {
  try {
    const url = new URL(value);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";

    if (!isHttp || value.length > 500) {
      throw new Error("Invalid image URL");
    }
  } catch {
    throw httpError("Image must be a valid http or https URL", 400);
  }
}

function normalizeResourceInput(body) {
  const name = readText(body.name);
  const description = readText(body.description);
  const categoryId = readText(body.categoryId);
  const location = readText(body.location);
  const image = readText(body.image);
  const totalQuantity = readNumber(body.totalQuantity);
  const availableQuantity = readNumber(body.availableQuantity);
  const status = readText(body.status) || "available";
  const instructions = readText(body.instructions);
  const requirements = readRequirements(body.requirements);

  if (name.length < 2 || name.length > 80) {
    throw httpError("Resource name must be 2 to 80 characters", 400);
  }

  if (description.length < 20 || description.length > 600) {
    throw httpError("Description must be 20 to 600 characters", 400);
  }

  if (!categoryId) {
    throw httpError("Category is required", 400);
  }

  if (location.length < 2 || location.length > 100) {
    throw httpError("Location must be 2 to 100 characters", 400);
  }

  validateImageUrl(image);

  if (
    !Number.isInteger(totalQuantity) ||
    totalQuantity < 1 ||
    totalQuantity > 500
  ) {
    throw httpError("Total quantity must be a whole number from 1 to 500", 400);
  }

  if (
    !Number.isInteger(availableQuantity) ||
    availableQuantity < 0 ||
    availableQuantity > 500
  ) {
    throw httpError(
      "Available quantity must be a whole number from 0 to 500",
      400
    );
  }

  if (availableQuantity > totalQuantity) {
    throw httpError("Available quantity cannot exceed total quantity", 400);
  }

  if (!RESOURCE_STATUSES.includes(status)) {
    throw httpError("Status must be available, unavailable or maintenance", 400);
  }

  if (instructions.length < 10 || instructions.length > 600) {
    throw httpError("Instructions must be 10 to 600 characters", 400);
  }

  return {
    name,
    description,
    categoryId,
    location,
    image,
    totalQuantity,
    availableQuantity,
    status,
    instructions,
    requirements,
  };
}

async function getCategoryOrThrow(categoryId) {
  const category = await Category.findById(categoryId);

  if (!category) {
    throw httpError("Choose a valid category", 400);
  }

  return category;
}

function getCategoryPrefix(name) {
  const prefix = name
    .split(/[^A-Za-z]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return prefix || "GEN";
}

async function buildAssetTag(prefix) {
  const resources = await Resource.find({}, "assetTag");
  const maxSequence = resources.reduce((max, resource) => {
    const match = /^EQ-[A-Z]+-(\d+)$/.exec(resource.assetTag);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `EQ-${prefix}-${String(maxSequence + 1).padStart(4, "0")}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildResourceQuery(queryParams) {
  const search = readText(queryParams.search);
  const categoryId = readText(queryParams.categoryId);
  const location = readText(queryParams.location);
  // The frontend uses `availability`. `status` is an alias for API clients.
  const availability =
    readText(queryParams.availability) ||
    readText(queryParams.status) ||
    "all";
  const query = {};

  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = [
      { name: pattern },
      { assetTag: pattern },
      { location: pattern },
      { description: pattern },
    ];
  }

  if (categoryId && categoryId !== "all") {
    query.categoryId = categoryId;
  }

  if (location && location !== "all") {
    query.location = location;
  }

  if (availability === "available") {
    query.status = "available";
    query.availableQuantity = { $gt: 0 };
  } else if (availability === "unavailable") {
    query.$and = [
      { status: { $ne: "maintenance" } },
      { $or: [{ status: "unavailable" }, { availableQuantity: 0 }] },
    ];
  } else if (availability === "maintenance") {
    query.status = "maintenance";
  }

  return query;
}

function getSortOption(sort) {
  const sortOptions = {
    newest: { createdAt: -1 },
    "name-asc": { name: 1 },
    "name-desc": { name: -1 },
    availability: { availableQuantity: -1 },
  };

  return sortOptions[sort] || sortOptions.newest;
}

export async function listResources(req, res, next) {
  try {
    const query = buildResourceQuery(req.query);
    const sortOption = getSortOption(readText(req.query.sort));
    const resources = await Resource.find(query).sort(sortOption);

    res.json({
      success: true,
      message: "Resources loaded successfully",
      data: { count: resources.length, resources },
    });
  } catch (error) {
    next(error);
  }
}

export async function getResource(req, res, next) {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      throw httpError("Resource not found", 404);
    }

    res.json({
      success: true,
      message: "Resource loaded successfully",
      data: { resource },
    });
  } catch (error) {
    next(error);
  }
}

export async function createResource(req, res, next) {
  try {
    const input = normalizeResourceInput(req.body);
    const category = await getCategoryOrThrow(input.categoryId);
    const assetTag = await buildAssetTag(getCategoryPrefix(category.name));

    const resource = await Resource.create({ ...input, assetTag });

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      data: { resource },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(httpError("Asset tag collision. Please try again.", 409));
    }

    next(error);
  }
}

export async function updateResource(req, res, next) {
  try {
    const input = normalizeResourceInput(req.body);
    await getCategoryOrThrow(input.categoryId);

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: input },
      { new: true, runValidators: true }
    );

    if (!resource) {
      throw httpError("Resource not found", 404);
    }

    res.json({
      success: true,
      message: "Resource updated successfully",
      data: { resource },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(httpError("Asset tag collision. Please try again.", 409));
    }

    next(error);
  }
}

export async function deleteResource(req, res, next) {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      throw httpError("Resource not found", 404);
    }

    res.json({
      success: true,
      message: "Resource deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
}
