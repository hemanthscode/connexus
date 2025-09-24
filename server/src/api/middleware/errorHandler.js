/**
 * Express error handler middleware.
 * Logs errors and sends response with message.
 */
const errorHandler = (err, req, res, next) => {
  console.error(
    JSON.stringify({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  );

  const status = err.statusCode || 500;
  const isOperational = status < 500;

  res.status(status).json({
    success: false,
    message: (process.env.NODE_ENV === 'development' || isOperational) ? err.message : 'Internal server error',
  });
};

export default errorHandler;
