// Handles requests that do not match any route.
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// Express identifies error middleware by its four parameters.
// It must be registered after all routes.
export function errorHandler(error, req, res, next) {
  // If a response is already being sent, let Express finish it.
  if (res.headersSent) {
    return next(error);
  }

  // Mongoose validation errors are caused by bad input, not a server failure.
  if (error.name === "ValidationError") {
    const firstError = Object.values(error.errors)[0];

    return res.status(400).json({
      success: false,
      message: firstError?.message || "Invalid input",
    });
  }

  // Invalid MongoDB IDs should also return a client error.
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid identifier",
    });
  }

  // Unique indexes can still reject a duplicate that slipped past a controller check.
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists",
    });
  }

  // Some errors (like invalid JSON) already include a status code.
  const statusCode = error.status || error.statusCode || 500;

  // Log the full error for us, but keep internal details out of production responses.
  console.error(error);

  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : error.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message,
  });
}
