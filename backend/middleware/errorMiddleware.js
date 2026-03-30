export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, _req, res, _next) => {
  const derivedStatusCode =
    error.statusCode ||
    (error.name === "MulterError" ? 400 : null) ||
    (error.name === "JsonWebTokenError" ? 401 : null) ||
    (error.name === "TokenExpiredError" ? 401 : null) ||
    500;

  res.status(derivedStatusCode).json({
    success: false,
    message: error.message || "Internal server error",
    errors: error.errors || [],
  });
};
