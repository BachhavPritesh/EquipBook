// Create an Error with an HTTP status code for the global error handler.
export function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
