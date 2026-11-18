import Category from "../models/Category.js";
import Resource from "../models/Resource.js";
import { httpError } from "../utils/httpError.js";

function readText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateCategoryInput(body) {
  const name = readText(body.name);
  const description = readText(body.description);

  if (name.length < 2 || name.length > 60) {
    throw httpError("Category name must be 2 to 60 characters", 400);
  }

  if (description.length < 10 || description.length > 300) {
    throw httpError("Category description must be 10 to 300 characters", 400);
  }

  return { name, description };
}

async function ensureUniqueName(name, excludeId = null) {
  const categories = await Category.find({}, "name");

  const duplicate = categories.find((category) => {
    const sameName = category.name.toLowerCase() === name.toLowerCase();
    const sameCategory = excludeId && category._id.toString() === excludeId;
    return sameName && !sameCategory;
  });

  if (duplicate) {
    throw httpError("A category with that name already exists", 409);
  }
}

function buildCategoryId(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `cat-${slug || "category"}`;
}

async function buildUniqueCategoryId(name) {
  const baseId = buildCategoryId(name);
  let id = baseId;
  let counter = 2;

  while (await Category.exists({ _id: id })) {
    id = `${baseId}-${counter}`;
    counter += 1;
  }

  return id;
}

export async function listCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.json({
      success: true,
      message: "Categories loaded successfully",
      data: { count: categories.length, categories },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw httpError("Category not found", 404);
    }

    res.json({
      success: true,
      message: "Category loaded successfully",
      data: { category },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, description } = validateCategoryInput(req.body);
    await ensureUniqueName(name);

    const category = await Category.create({
      _id: await buildUniqueCategoryId(name),
      name,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(httpError("A category with that name already exists", 409));
    }

    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { name, description } = validateCategoryInput(req.body);
    await ensureUniqueName(name, req.params.id);

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { name, description } },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw httpError("Category not found", 404);
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(httpError("A category with that name already exists", 409));
    }

    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      throw httpError("Category not found", 404);
    }

    const resourceExists = await Resource.exists({ categoryId: category._id });
    if (resourceExists) {
      throw httpError(
        "Move or delete the resources in this category before removing it",
        409
      );
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
}
