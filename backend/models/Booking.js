import mongoose from "mongoose";

export const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
];

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: [true, "Booking reference is required"],
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booking user is required"],
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: [true, "Booking resource is required"],
      index: true,
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      trim: true,
      minlength: [10, "Purpose must be at least 10 characters"],
      maxlength: [240, "Purpose must be 240 characters or fewer"],
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Start date must use YYYY-MM-DD"],
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "End date must use YYYY-MM-DD"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must use HH:mm"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "End time must use HH:mm"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [50, "Quantity must be 50 or fewer"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: "Status must be pending, approved, rejected, cancelled or completed",
      },
      default: "pending",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes must be 500 characters or fewer"],
      default: "",
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Admin notes must be 500 characters or fewer"],
      default: "",
    },
    decisionAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// The start and end values are stored as separate date/time strings.
// This hook checks them together using real Date objects.
bookingSchema.pre("validate", function () {
  const start = new Date(`${this.startDate}T${this.startTime}:00`);
  const end = new Date(`${this.endDate}T${this.endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return;
  }

  if (start >= end) {
    this.invalidate(
      "endTime",
      "The end date and time must be after the start"
    );
  }
});

// Add the field names the frontend Booking type expects.
bookingSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    const userId =
      returnedObject.user?._id ??
      returnedObject.user?.id ??
      returnedObject.user;
    const resourceId =
      returnedObject.resource?._id ??
      returnedObject.resource?.id ??
      returnedObject.resource;

    returnedObject.id = returnedObject._id.toString();
    returnedObject.userId = userId ? userId.toString() : null;
    returnedObject.resourceId = resourceId ? resourceId.toString() : null;

    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
