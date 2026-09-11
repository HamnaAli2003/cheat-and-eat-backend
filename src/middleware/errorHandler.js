export const errorHandler = (error, req, res, next) => {
  console.error(error);

  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  // PostgreSQL: unique constraint violation
  if (error.code === "23505") {
    statusCode = 409;
    message = "Email is already registered";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};