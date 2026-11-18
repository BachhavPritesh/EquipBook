import Booking, { BOOKING_STATUSES } from "../models/Booking.js";
import Resource from "../models/Resource.js";
import { httpError } from "../utils/httpError.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_BOOKING_QUANTITY = 50;

const BOOKING_POPULATE = [
  { path: "user", select: "name email department phone role" },
  { path: "resource", select: "name assetTag image location categoryId" },
];

function readText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return NaN;
  }

  return Number(value);
}

function isStaff(user) {
  return user.role === "manager" || user.role === "admin";
}

function getReferenceId(value) {
  if (!value) {
    return null;
  }

  return value._id?.toString?.() ?? value.toString?.() ?? null;
}

function combineDateTime(date, time) {
  const value = new Date(`${date}T${time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

// Convert the date/time strings into real Date objects for comparisons.
function parseWindow(input) {
  const startDate = readText(input.startDate);
  const endDate = readText(input.endDate);
  const startTime = readText(input.startTime);
  const endTime = readText(input.endTime);

  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
    throw httpError("Dates must use the YYYY-MM-DD format", 400);
  }

  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    throw httpError("Times must use the HH:mm format", 400);
  }

  const start = combineDateTime(startDate, startTime);
  const end = combineDateTime(endDate, endTime);

  if (!start || !end) {
    throw httpError("Please provide a valid booking window", 400);
  }

  if (start >= end) {
    throw httpError("The end date and time must be after the start", 400);
  }

  return { start, end, startDate, endDate, startTime, endTime };
}

// Count the units of approved bookings that overlap the requested window.
// Pending bookings are intentionally ignored until a manager approves them.
async function getApprovedBookedQuantity(resourceId, windowStart, windowEnd) {
  const bookings = await Booking.find({
    resource: resourceId,
    status: "approved",
  }).select("startDate endDate startTime endTime quantity");

  return bookings.reduce((total, booking) => {
    const bookingStart = combineDateTime(
      booking.startDate,
      booking.startTime
    );
    const bookingEnd = combineDateTime(booking.endDate, booking.endTime);

    if (!bookingStart || !bookingEnd) {
      return total;
    }

    const overlaps =
      bookingStart < windowEnd && bookingEnd > windowStart;

    return overlaps ? total + booking.quantity : total;
  }, 0);
}

async function getResourceAvailability(resource, window) {
  const alreadyBooked = await getApprovedBookedQuantity(
    resource._id,
    window.start,
    window.end
  );

  return {
    alreadyBooked,
    availableQuantity: Math.max(0, resource.availableQuantity - alreadyBooked),
  };
}

function normalizeBookingInput(body, resource) {
  const purpose = readText(body.purpose);
  const quantity = readNumber(body.quantity);
  const notes = readText(body.notes);
  const window = parseWindow(body);

  if (purpose.length < 10 || purpose.length > 240) {
    throw httpError("Purpose must be 10 to 240 characters", 400);
  }

  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_BOOKING_QUANTITY
  ) {
    throw httpError("Quantity must be a whole number from 1 to 50", 400);
  }

  if (quantity > resource.totalQuantity) {
    throw httpError(
      "Quantity cannot exceed the total quantity of the resource",
      400
    );
  }

  if (notes.length > 500) {
    throw httpError("Notes must be 500 characters or fewer", 400);
  }

  return {
    purpose,
    quantity,
    notes,
    startDate: window.startDate,
    endDate: window.endDate,
    startTime: window.startTime,
    endTime: window.endTime,
    window,
  };
}

async function generateBookingReference() {
  const year = new Date().getFullYear();
  const prefix = `EQ-${year}-`;
  const latestBooking = await Booking.findOne({
    bookingReference: { $regex: `^${prefix}` },
  }).sort({ bookingReference: -1 });

  let sequence = 1;

  if (latestBooking) {
    const parts = latestBooking.bookingReference.split("-");
    const parsedSequence = Number(parts[2]);

    if (Number.isInteger(parsedSequence) && parsedSequence > 0) {
      sequence = parsedSequence + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(4, "0")}`;
}

// Retry a few times when two requests try to use the same reference.
async function createBookingDocument(data) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const bookingReference = await generateBookingReference();

    try {
      return await Booking.create({ ...data, bookingReference });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }
    }
  }

  throw httpError(
    "Could not generate a unique booking reference. Please try again.",
    409
  );
}

export async function createBooking(req, res, next) {
  try {
    const resourceId = readText(req.body.resourceId);

    if (!resourceId) {
      throw httpError("Resource is required", 400);
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      throw httpError("Resource not found", 404);
    }

    if (resource.status !== "available") {
      throw httpError("This resource is not available for booking", 400);
    }

    const input = normalizeBookingInput(req.body, resource);
    const availability = await getResourceAvailability(resource, input.window);

    if (input.quantity > availability.availableQuantity) {
      throw httpError(
        `Only ${availability.availableQuantity} unit${
          availability.availableQuantity === 1 ? " is" : "s are"
        } available for the selected dates and times`,
        409
      );
    }

    const booking = await createBookingDocument({
      user: req.user._id,
      resource: resource._id,
      purpose: input.purpose,
      startDate: input.startDate,
      endDate: input.endDate,
      startTime: input.startTime,
      endTime: input.endTime,
      quantity: input.quantity,
      notes: input.notes,
      status: "pending",
    });

    await booking.populate(BOOKING_POPULATE);

    res.status(201).json({
      success: true,
      message: "Booking request created successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function listBookings(req, res, next) {
  try {
    const status = readText(req.query.status);
    const resourceId = readText(req.query.resourceId);
    const query = {};

    // Regular users only see their own bookings. Staff see everything.
    if (isStaff(req.user)) {
      const userId = readText(req.query.userId);

      if (userId) {
        query.user = userId;
      }
    } else {
      query.user = req.user._id;
    }

    if (resourceId) {
      query.resource = resourceId;
    }

    if (status && status !== "all") {
      if (!BOOKING_STATUSES.includes(status)) {
        throw httpError("Invalid booking status filter", 400);
      }

      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Bookings loaded successfully",
      data: { count: bookings.length, bookings },
    });
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate(
      BOOKING_POPULATE
    );

    if (!booking) {
      throw httpError("Booking not found", 404);
    }

    if (
      !isStaff(req.user) &&
      getReferenceId(booking.user) !== req.user._id.toString()
    ) {
      throw httpError("You can only view your own bookings", 403);
    }

    res.json({
      success: true,
      message: "Booking loaded successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw httpError("Booking not found", 404);
    }

    if (getReferenceId(booking.user) !== req.user._id.toString()) {
      throw httpError("You can only cancel your own bookings", 403);
    }

    if (booking.status !== "pending") {
      throw httpError("Only pending bookings can be cancelled", 409);
    }

    booking.status = "cancelled";
    booking.decisionAt = new Date();
    await booking.save();
    await booking.populate(BOOKING_POPULATE);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function approveBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw httpError("Booking not found", 404);
    }

    if (getReferenceId(booking.user) === req.user._id.toString()) {
      throw httpError("You cannot approve or reject your own booking", 403);
    }

    if (booking.status !== "pending") {
      throw httpError("Only pending bookings can be approved", 409);
    }

    const adminNotes = readText(req.body.adminNotes ?? req.body.notes);

    if (adminNotes.length > 500) {
      throw httpError("Admin notes must be 500 characters or fewer", 400);
    }

    const resource = await Resource.findById(booking.resource);

    if (!resource) {
      throw httpError("The booked resource no longer exists", 404);
    }

    const window = parseWindow(booking);
    const availability = await getResourceAvailability(resource, window);

    if (resource.status !== "available") {
      throw httpError("This resource is not available for booking", 409);
    }

    if (booking.quantity > availability.availableQuantity) {
      throw httpError(
        `Only ${availability.availableQuantity} unit${
          availability.availableQuantity === 1 ? " is" : "s are"
        } available for this booking window`,
        409
      );
    }

    booking.status = "approved";
    booking.adminNotes = adminNotes;
    booking.decisionAt = new Date();
    await booking.save();
    await booking.populate(BOOKING_POPULATE);

    res.json({
      success: true,
      message: "Booking approved successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw httpError("Booking not found", 404);
    }

    if (getReferenceId(booking.user) === req.user._id.toString()) {
      throw httpError("You cannot approve or reject your own booking", 403);
    }

    if (booking.status !== "pending") {
      throw httpError("Only pending bookings can be rejected", 409);
    }

    const adminNotes = readText(req.body.adminNotes ?? req.body.notes);

    if (adminNotes.length < 5 || adminNotes.length > 500) {
      throw httpError(
        "Add a rejection reason between 5 and 500 characters",
        400
      );
    }

    booking.status = "rejected";
    booking.adminNotes = adminNotes;
    booking.decisionAt = new Date();
    await booking.save();
    await booking.populate(BOOKING_POPULATE);

    res.json({
      success: true,
      message: "Booking rejected successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBookingNotes(req, res, next) {
  try {
    const adminNotes = readText(req.body.adminNotes ?? req.body.notes);

    if (adminNotes.length > 500) {
      throw httpError("Admin notes must be 500 characters or fewer", 400);
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw httpError("Booking not found", 404);
    }

    booking.adminNotes = adminNotes;
    await booking.save();
    await booking.populate(BOOKING_POPULATE);

    res.json({
      success: true,
      message: "Booking notes updated successfully",
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
}

export async function checkAvailability(req, res, next) {
  try {
    const resourceId = readText(req.query.resourceId);
    const quantity = readNumber(req.query.quantity);
    const window = parseWindow(req.query);

    if (!resourceId) {
      throw httpError("resourceId is required", 400);
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw httpError("quantity must be a positive whole number", 400);
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      throw httpError("Resource not found", 404);
    }

    const availability = await getResourceAvailability(resource, window);
    const canBook =
      resource.status === "available" &&
      availability.availableQuantity >= quantity;

    res.json({
      success: true,
      message: canBook
        ? "The requested quantity is available"
        : "The requested quantity is not available",
      data: {
        resource: {
          id: resource._id.toString(),
          name: resource.name,
          totalQuantity: resource.totalQuantity,
          availableQuantity: resource.availableQuantity,
          status: resource.status,
        },
        requestedQuantity: quantity,
        alreadyBooked: availability.alreadyBooked,
        availableQuantity: availability.availableQuantity,
        canBook,
        window: {
          startDate: window.startDate,
          endDate: window.endDate,
          startTime: window.startTime,
          endTime: window.endTime,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
