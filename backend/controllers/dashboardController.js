import Booking from "../models/Booking.js";
import Resource from "../models/Resource.js";
import User from "../models/User.js";

const RECENT_LIMIT = 5;

const BOOKING_POPULATE = [
  { path: "user", select: "name email department phone role" },
  { path: "resource", select: "name assetTag image location categoryId" },
];

// Build the same inventory summary the frontend dashboard displays.
function getInventorySummary(resources) {
  return resources.reduce(
    (summary, resource) => {
      const isMaintenance = resource.status === "maintenance";
      const lowStockThreshold = Math.max(
        1,
        Math.floor(resource.totalQuantity * 0.25)
      );

      return {
        totalResources: summary.totalResources + 1,
        totalUnits: summary.totalUnits + resource.totalQuantity,
        availableUnits: summary.availableUnits + resource.availableQuantity,
        fullyBooked:
          summary.fullyBooked +
          (!isMaintenance && resource.availableQuantity === 0 ? 1 : 0),
        maintenance: summary.maintenance + (isMaintenance ? 1 : 0),
        lowStock:
          summary.lowStock +
          (!isMaintenance &&
          resource.availableQuantity > 0 &&
          resource.availableQuantity <= lowStockThreshold
            ? 1
            : 0),
      };
    },
    {
      totalResources: 0,
      totalUnits: 0,
      availableUnits: 0,
      fullyBooked: 0,
      maintenance: 0,
      lowStock: 0,
    }
  );
}

export async function getUserDashboard(req, res, next) {
  try {
    const userId = req.user._id;

    const [
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      cancelledBookings,
      completedBookings,
      recentBookings,
    ] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: "pending" }),
      Booking.countDocuments({ user: userId, status: "approved" }),
      Booking.countDocuments({ user: userId, status: "rejected" }),
      Booking.countDocuments({ user: userId, status: "cancelled" }),
      Booking.countDocuments({ user: userId, status: "completed" }),
      Booking.find({ user: userId })
        .populate(BOOKING_POPULATE)
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT),
    ]);

    res.json({
      success: true,
      message: "User dashboard loaded successfully",
      data: {
        stats: {
          totalBookings,
          pendingBookings,
          approvedBookings,
          rejectedBookings,
          cancelledBookings,
          completedBookings,
          rejectedOrCancelled: rejectedBookings + cancelledBookings,
        },
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminDashboard(req, res, next) {
  try {
    const [
      totalUsers,
      resources,
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      cancelledBookings,
      completedBookings,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments(),
      Resource.find({}, "totalQuantity availableQuantity status"),
      Booking.countDocuments(),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "approved" }),
      Booking.countDocuments({ status: "rejected" }),
      Booking.countDocuments({ status: "cancelled" }),
      Booking.countDocuments({ status: "completed" }),
      Booking.find()
        .populate(BOOKING_POPULATE)
        .sort({ createdAt: -1 })
        .limit(RECENT_LIMIT),
    ]);

    const resourceSummary = getInventorySummary(resources);

    res.json({
      success: true,
      message: "Admin dashboard loaded successfully",
      data: {
        stats: {
          totalUsers,
          totalResources: resourceSummary.totalResources,
          totalBookings,
          pendingBookings,
          approvedBookings,
          rejectedBookings,
          cancelledBookings,
          completedBookings,
        },
        recentBookings,
        resourceSummary,
      },
    });
  } catch (error) {
    next(error);
  }
}
