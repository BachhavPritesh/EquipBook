import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [60, "Category name must be 60 characters or fewer"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Category description is required"],
      trim: true,
      minlength: [10, "Category description must be at least 10 characters"],
      maxlength: [300, "Category description must be 300 characters or fewer"],
    },
  },
  { timestamps: true }
);

// Expose the frontend-friendly `id` field instead of `_id`.
categorySchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
