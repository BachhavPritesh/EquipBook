import mongoose from "mongoose";

export const RESOURCE_STATUSES = ["available", "unavailable", "maintenance"];

const resourceSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, "Asset tag is required"],
      unique: true,
      trim: true,
      match: [/^EQ-[A-Z]+-\d{4}$/, "Asset tag must look like EQ-AV-0001"],
    },
    name: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
      minlength: [2, "Resource name must be at least 2 characters"],
      maxlength: [80, "Resource name must be 80 characters or fewer"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [600, "Description must be 600 characters or fewer"],
    },
    categoryId: {
      type: String,
      required: [true, "Category is required"],
      ref: "Category",
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: [2, "Location must be at least 2 characters"],
      maxlength: [100, "Location must be 100 characters or fewer"],
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    totalQuantity: {
      type: Number,
      required: [true, "Total quantity is required"],
      min: [1, "Total quantity must be at least 1"],
      max: [500, "Total quantity must be 500 or fewer"],
    },
    availableQuantity: {
      type: Number,
      required: [true, "Available quantity is required"],
      min: [0, "Available quantity cannot be negative"],
      max: [500, "Available quantity must be 500 or fewer"],
    },
    status: {
      type: String,
      enum: {
        values: RESOURCE_STATUSES,
        message: "Status must be available, unavailable or maintenance",
      },
      default: "available",
    },
    instructions: {
      type: String,
      required: [true, "Instructions are required"],
      trim: true,
      minlength: [10, "Instructions must be at least 10 characters"],
      maxlength: [600, "Instructions must be 600 characters or fewer"],
    },
    requirements: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (items) => items.length > 0,
          message: "Add at least one booking requirement",
        },
        {
          validator: (items) => items.join(" ").length <= 600,
          message: "Requirements must be 600 characters or fewer",
        },
      ],
    },
  },
  { timestamps: true }
);

// These two fields depend on each other, so check them together.
resourceSchema.pre("validate", function () {
  if (this.availableQuantity > this.totalQuantity) {
    this.invalidate(
      "availableQuantity",
      "Available quantity cannot exceed total quantity"
    );
  }
});

// Expose the frontend-friendly `id` field instead of `_id`.
resourceSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
